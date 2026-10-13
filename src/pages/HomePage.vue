<script setup lang="ts">
import FeaturedProjects from '../components/FeaturedProjects.vue'
import profile from '../data/profile.json'
</script>

<template>
  <section class="hero wrap">
    <div class="hero-copy">
      <p class="hero-location">{{ profile.location }}</p>
      <h1>Software engineering.<br><span>Testing in practice.</span></h1>
      <p class="hero-description">I’m Leon, a Software Engineering master’s student at Curtin University. My projects explore how software handles failures, keeps useful records and makes its behaviour easier to understand.</p>
      <div class="actions">
        <a class="button primary" href="#projects">Explore my projects</a>
        <a class="button secondary" :href="profile.resume">Download resume</a>
      </div>
      <p class="hero-availability">Seeking a software engineering internship.<br><span>{{ profile.internshipStart }}.</span></p>
    </div>
    <aside class="intro-note">
      <p class="note-label">Current focus</p>
      <h2>From a response<br>to reliable evidence.</h2>
      <p>Device communication, repeatable tests and clear explanations of what actually happened.</p>
      <dl><div><dt>Study</dt><dd>{{ profile.degree }}</dd></div><div><dt>Specialisation</dt><dd>{{ profile.specialisation }}</dd></div><div><dt>Graduation</dt><dd>{{ profile.graduation }}</dd></div></dl>
    </aside>
  </section>

  <FeaturedProjects />

  <section id="about" class="about wrap section">
    <div class="about-copy">
      <h2>About me</h2>
      <p>I’m completing a {{ profile.degree }} in {{ profile.specialisation }} at {{ profile.university }}, following a dual Bachelor of Engineering qualification from the University of Aberdeen and South China Normal University.</p>
      <p>During my software engineering internship, I built Vue.js interfaces, integrated REST APIs and fixed defects through functional testing. My current projects extend that work into Python services, offline applications and developer tools.</p>
      <div class="actions"><a class="text-link" :href="profile.github">GitHub profile</a><a class="text-link" :href="profile.linkedin">LinkedIn profile</a></div>
    </div>
    <div class="about-details">
      <h3>Study and availability</h3>
      <dl class="availability">
        <div><dt>Graduation</dt><dd>{{ profile.graduation }}</dd></div>
        <div><dt>Internship start</dt><dd>{{ profile.internshipStart }}</dd></div>
        <div><dt>Availability</dt><dd>{{ profile.availability }}</dd></div>
        <div><dt>Work rights</dt><dd>{{ profile.workRights }}</dd></div>
      </dl>
    </div>
  </section>

  <section class="contact-section">
    <div class="contact wrap">
      <div><h2>Let’s discuss an internship.</h2><p>I’m interested in teams building software for practical engineering and operational problems.</p></div>
      <a :href="`mailto:${profile.email}`">{{ profile.email }}</a>
    </div>
  </section>
</template>
