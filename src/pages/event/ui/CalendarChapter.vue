<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { daysUntil, isEclipseId, upcomingSkyEvents } from '@/entities/sky'
import { ROUTES } from '@/shared/config'
import { formatUtc } from '@/shared/lib'

import { sectionId } from '../lib/chapters'

const { t } = useI18n()
const now = new Date()
const events = upcomingSkyEvents(now)

const tiles = computed(() =>
  events.map((event) => {
    const days = daysUntil(event.date, now)
    return { ...event, count: days === 0 ? t('event.calendar.today') : `D-${days}`, when: formatUtc(event.date, true) }
  }),
)
</script>

<template>
  <section :id="sectionId('calendar')" class="chapter chapter--calendar" tabindex="-1" aria-labelledby="event-calendar-title">
    <div class="calendar">
      <p class="eyebrow" data-reveal>{{ t('event.calendar.eyebrow') }}</p>
      <h2 id="event-calendar-title" class="headline" data-reveal>
        <span>{{ t('event.calendar.titleA') }}</span>
        <span>{{ t('event.calendar.titleB') }}</span>
      </h2>
      <ul class="tiles">
        <li v-for="tile in tiles" :key="tile.id" class="tile" data-reveal>
          <p class="tile__kind">{{ t(`event.names.${tile.id}`) }} · {{ t(`event.kinds.${tile.kind}`) }}</p>
          <p class="tile__count">{{ tile.count }}</p>
          <p class="tile__date"><time :datetime="tile.date.toISOString()">{{ tile.when }}</time></p>
          <RouterLink :to="{ path: ROUTES.observatory, query: { at: tile.date.toISOString(), ...(isEclipseId(tile.id) ? { event: tile.id } : {}) } }" class="tile__link">
            <span class="sr-only">{{ t(`event.names.${tile.id}`) }}, </span>{{ t('event.calendar.viewSky') }}
          </RouterLink>
        </li>
      </ul>
      <p class="calendar__note" data-reveal>{{ t('event.calendar.note') }}</p>
    </div>
  </section>
</template>

<style scoped>
.calendar {
  width: 100%;
  max-width: 76rem;
  margin-inline: auto;
}
.headline span {
  display: block;
}
.headline {
  margin: 0 0 2.5rem;
  color: #eef2ff;
  font: 700 clamp(2.25rem, 6vw, 5rem) / 1.04 var(--font-display);
  font-stretch: 112%;
}
.headline span:last-child {
  margin-left: clamp(2rem, 10vw, 9rem);
}
.tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.tile {
  position: relative;
  isolation: isolate;
  padding: 1.5rem 1.25rem;
}
.tile::before,
.tile::after {
  content: '';
  position: absolute;
  z-index: -1;
  clip-path: polygon(var(--cut) 0, 100% 0, 100% calc(100% - var(--cut)), calc(100% - var(--cut)) 100%, 0 100%, 0 var(--cut));
}
.tile::before {
  inset: 0;
  background: var(--hud-line);
}
.tile::after {
  inset: 1px;
  background: rgb(4 10 34 / 0.88);
}
.tile p {
  margin: 0;
}
.tile__kind {
  min-height: 2.5rem;
  color: var(--hud-text);
  font: 500 0.8125rem/1.5 var(--font-mono);
}
.tile__count {
  margin-block: 0.75rem !important;
  color: #fff;
  font: 700 clamp(2.25rem, 4.2vw, 3.75rem) / 1 var(--font-display);
  font-variant-numeric: tabular-nums;
}
.tile__link {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  margin-top: 0.5rem;
  color: #fff;
  font: 600 0.8125rem var(--font-mono);
  text-underline-offset: 0.25em;
}
.tile__link:hover {
  color: var(--signal-text);
}
.tile__date {
  color: var(--hud-dim);
  font: 400 0.8125rem var(--font-mono);
}
.calendar__note {
  max-width: 44rem;
  margin: 1.5rem 0 0;
  color: var(--hud-body);
  font-size: 0.9375rem;
}
@media (max-width: 1000px) {
  .tiles {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 480px) {
  .tiles {
    grid-template-columns: minmax(0, 1fr);
  }
  .tile {
    padding: 1rem 1.25rem;
  }
  .tile__kind {
    min-height: 0;
  }
}
</style>
