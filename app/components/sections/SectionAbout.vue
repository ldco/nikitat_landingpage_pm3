<script setup lang="ts">
import '~/assets/css/runtime/section-about.css'

const { t, te } = useI18n()

defineProps<{
  title?: string
}>()

const sectionTitle = computed(() => {
  if (te('about.title')) return t('about.title')
  if (te('nav.about')) return t('nav.about')
  return ''
})

const paragraph1 = computed(() => te('about.paragraph1') ? t('about.paragraph1') : '')
const paragraph2 = computed(() => te('about.paragraph2') ? t('about.paragraph2') : '')
</script>

<template>
  <section id="about" class="section about-section">
    <div class="container">
      <h2 v-if="title || sectionTitle" v-reveal class="section-title">
        <span>{{ title || sectionTitle }}</span>
      </h2>

      <div class="section-body">
        <div class="about-grid">
          <div class="about-visual" v-reveal="{ animation: 'fade-up', delay: 150 }">
            <div class="about-visual__border">
              <div class="about-visual__squircle">
              <MoleculesBeforeAfterSlider
                before-src="/images/about/2_r.png"
                after-src="/images/about/2.png"
                :width="500"
                :height="500"
                :initial="0"
              />
            </div>
            </div>
          </div>

          <div class="about-content" v-reveal>
            <p v-if="paragraph1" class="about-content__lead">{{ paragraph1 }}</p>
            <p v-if="paragraph2" class="about-content__body">{{ paragraph2 }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
