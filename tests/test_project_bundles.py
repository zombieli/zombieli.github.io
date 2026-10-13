import importlib.util
from pathlib import Path
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('bundle_checks', Path(__file__).resolve().parents[1] / 'scripts/check-project-bundles.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class BundleExtractionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.archive = self.root / 'sample.zip'
        self.destination = self.root / 'unpacked'

    def tearDown(self):
        self.temp.cleanup()

    def write(self, entries):
        with zipfile.ZipFile(self.archive, 'w') as archive:
            for name, body in entries:
                if isinstance(name, str) and '\\' in name:
                    raw_name = name
                    name = zipfile.ZipInfo(raw_name)
                    name.filename = raw_name  # Preserve the malformed archive name on Windows.
                archive.writestr(name, body)

    def reject(self, entries):
        self.write(entries)
        with self.assertRaises(ValueError):
            module.extract_bundle(self.archive, self.destination, 'example')
        self.assertFalse(self.destination.exists(), 'Invalid archives must be rejected before extraction')

    def test_valid_source_can_be_read_after_extraction(self):
        self.write([('example/web/core.mjs', 'export const result = 7'), ('example/README.md', 'Example')])
        project = module.extract_bundle(self.archive, self.destination, 'example')
        self.assertEqual((project / 'web/core.mjs').read_text(), 'export const result = 7')

    def test_late_traversal_does_not_partially_extract_valid_members(self):
        self.reject([('example/README.md', 'Example'), ('example/../../outside', 'bad')])
        self.assertFalse((self.root / 'outside').exists())

    def test_absolute_and_windows_style_paths_are_rejected(self):
        for name in ['/example/file', 'C:/example/file', 'example\\file']:
            with self.subTest(name=name):
                self.reject([(name, 'bad')])

    def test_other_project_root_is_rejected(self):
        self.reject([('another/README.md', 'bad')])

    def test_case_collisions_are_rejected_on_all_platforms(self):
        self.reject([('example/README.md', 'first'), ('example/readme.md', 'second')])

    def test_symlink_cannot_escape_the_extraction_root(self):
        link = zipfile.ZipInfo('example/link')
        link.create_system = 3
        link.external_attr = 0o120777 << 16
        self.reject([(link, '../../outside')])

    def test_empty_archive_is_not_a_source_delivery(self):
        self.reject([])

    def test_expanded_size_budget_is_enforced_before_writing(self):
        self.write([('example/large.txt', '0123456789')])
        with self.assertRaises(ValueError):
            module.extract_bundle(self.archive, self.destination, 'example', max_bytes=9)
        self.assertFalse(self.destination.exists())


if __name__ == '__main__':
    unittest.main()
