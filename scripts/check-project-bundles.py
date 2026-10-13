"""Verify downloadable source archives and run their real tests in temporary directories."""
import argparse
from datetime import datetime, timezone
from hashlib import sha256
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import subprocess
import tempfile
import zipfile

PROJECTS = ('inspection-notebook', 'test-report-delta', 'technical-manual-search')


def extract_bundle(archive_path, destination, project, max_bytes=25 * 1024 * 1024):
    destination = Path(destination).resolve()
    with zipfile.ZipFile(archive_path) as archive:
        entries = archive.infolist()
        if not entries or len(entries) > 1000 or sum(entry.file_size for entry in entries) > max_bytes:
            raise ValueError('Empty source bundle or extraction budget exceeded')
        seen = set()
        for entry in entries:
            name = entry.orig_filename
            path = PurePosixPath(name)
            target = (destination / path).resolve()
            if ('\\' in name or path.is_absolute() or '..' in path.parts
                    or not path.parts or path.parts[0] != project
                    or not target.is_relative_to(destination)
                    or stat.S_ISLNK(entry.external_attr >> 16)):
                raise ValueError(f'Unsafe source member: {name}')
            identity = path.as_posix().casefold()
            if identity in seen:
                raise ValueError(f'Duplicate source member: {name}')
            seen.add(identity)
        # Validate the complete archive before writing any member.
        destination.mkdir(parents=True, exist_ok=True)
        archive.extractall(destination)
    return destination / project


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default='node')
    parser.add_argument('--browser', action='store_true', help='Also run each source archive browser scenario against BASE_URL')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    output = root / 'qa/bundle-verification'
    output.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((root / 'public/evidence/release-manifest.json').read_text(encoding='utf-8'))
    bundles = {bundle['project']: bundle for bundle in manifest['bundles']}
    checks = []
    with tempfile.TemporaryDirectory(prefix='portfolio-source-') as temporary:
        for project in PROJECTS:
            bundle = bundles.get(project)
            if not bundle:
                raise ValueError(f'Missing source bundle: {project}')
            archive = root / 'public/downloads' / f'{project}.zip'
            if sha256(archive.read_bytes()).hexdigest() != bundle['sha256']:
                raise ValueError(f'Source hash mismatch: {project}')
            extracted = extract_bundle(archive, Path(temporary) / project, project)
            tests = sorted((extracted / 'tests').glob('*.test.mjs'))
            if not tests:
                raise ValueError(f'No runnable source tests: {project}')
            test = subprocess.run([args.node, '--test', '--test-reporter=spec', *[str(p.relative_to(extracted)) for p in tests]], cwd=extracted, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=120)
            log = test.stdout + test.stderr
            (output / f'{project}-tests.txt').write_text(log, encoding='utf-8')
            if test.returncode:
                raise RuntimeError(f'{project} source tests failed; see qa/bundle-verification/{project}-tests.txt')
            match = re.search(r'(?m)^.*?tests (\d+)\s*$', log)
            result = {'project': project, 'sha256': bundle['sha256'], 'tests_passed': int(match.group(1)) if match else None, 'exit_code': test.returncode}
            if args.browser:
                candidates = [extracted / 'scripts' / name for name in ('browser-qa.cjs', 'browser-check.mjs', 'browser-qa.mjs')]
                runners = [path for path in candidates if path.is_file()]
                if len(runners) != 1:
                    raise ValueError(f'Expected one reusable browser runner: {project}')
                environment = dict(os.environ)
                environment['BASE_URL'] = environment.get('BASE_URL', 'http://127.0.0.1:4173').rstrip('/') + f'/demos/{project}/'
                environment['PLAYWRIGHT_MODULE'] = environment.get('PLAYWRIGHT_MODULE', str(root / 'node_modules/playwright'))
                environment['EVIDENCE_DIR'] = str(output / project)
                environment['QA_OUTPUT_DIR'] = str(output / project)
                report_name = {'inspection-notebook': 'browser-results.json', 'test-report-delta': 'browser-verification.json', 'technical-manual-search': 'browser-report.json'}[project]
                browser_output = output / project
                browser_output.mkdir(parents=True, exist_ok=True)
                # Remove only these known report files so a stale archived report cannot count as a fresh run.
                for report in [browser_output / report_name, extracted / 'evidence' / report_name]:
                    report.unlink(missing_ok=True)
                browser = subprocess.run([args.node, str(runners[0].relative_to(extracted))], cwd=extracted, env=environment, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=180)
                (output / f'{project}-browser.txt').write_text(browser.stdout + browser.stderr, encoding='utf-8')
                if browser.returncode:
                    raise RuntimeError(f'{project} browser checks failed; see qa/bundle-verification/{project}-browser.txt')
                if not (browser_output / report_name).is_file():
                    shutil.copy2(extracted / 'evidence' / report_name, browser_output / report_name)
                browser_report = json.loads((browser_output / report_name).read_text(encoding='utf-8'))
                browser_checks = browser_report.get('checks', [])
                if not browser_checks or not all(check.get('passed') is True for check in browser_checks):
                    raise RuntimeError(f'Missing or failed browser evidence: {project}')
                result['browser_checks_passed'] = len(browser_checks)
                result['browser_exit_code'] = browser.returncode
            checks.append(result)
            print(f"{project}: {result['tests_passed']} tests passed from downloaded source" + ('; browser checks passed' if args.browser else ''))
    report = {'executed_at_utc': datetime.now(timezone.utc).isoformat(), 'checks': checks, 'scope': 'Source archives extracted into temporary directories; no project dependency installation.'}
    (root / 'qa/bundle-results.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
