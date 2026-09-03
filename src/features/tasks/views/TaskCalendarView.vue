<template>
  <div class="calendar-page">
    <div class="page-header">
      <h1>Calendario de tareas</h1>
      <p>Visualiza las tareas organizadas por fecha límite.</p>
    </div>

    <div class="calendar-card">
      <div class="calendar-toolbar">
        <div class="calendar-nav">
          <button
            class="month-btn"
            @click="previousMonth"
          >
            <ChevronLeft :size="20" />
          </button>

          <h2 class="calendar-title">
            {{ currentMonth }}
          </h2>

          <button
            class="month-btn"
            @click="nextMonth"
          >
            <ChevronRight :size="20" />
          </button>
        </div>

        <div class="view-switch">
          <button
            class="calendar-btn"
            @click="goToToday"
          >
            Hoy
          </button>

          <button
            class="calendar-btn"
            :class="{ 'calendar-btn--active': calendarView === 'day' }"
            @click="calendarView = 'day'"
          >
            Día
          </button>

          <button
            class="calendar-btn"
            :class="{ 'calendar-btn--active': calendarView === 'week' }"
            @click="calendarView = 'week'"
          >
            Semana
          </button>

          <button
            class="calendar-btn"
            :class="{ 'calendar-btn--active': calendarView === 'month' }"
            @click="calendarView = 'month'"
          >
            Mes
          </button>
        </div>
      </div>

      <div
        v-if="calendarView === 'month'"
        class="calendar-grid"
      >
        <div
          v-for="day in weekDays"
          :key="day"
          class="weekday"
        >
          {{ day }}
        </div>

        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          class="day-cell"
          :class="{
            today: day.isToday,
            outside: !day.currentMonth,
          }"
        >
          <div class="day-cell-header">
            <span class="mobile-weekday">
              {{ weekDays[index % 7] }}
            </span>

            <span class="day-number">
              {{ day.day }}
            </span>
          </div>

          <div
            v-for="task in day.currentMonth
              ? getTasksForDay(day.day)
              : []"
            :key="task.id"
            class="task-chip"
            @click="editTask(task)"
          >
            <span
              class="task-dot"
              :class="priorityClass(task.priority)"
            ></span>

            <span
              class="task-title"
              :title="task.title"
            >
              {{ shortTitle(task.title) }}
            </span>
          </div>
        </div>
      </div>

      <div
        v-else-if="calendarView === 'week'"
        class="week-view"
      >
        <div class="week-grid">
          <div
            v-for="day in weekDaysData"
            :key="day.name"
            class="week-column"
          >
            <div class="week-header">
              <h3>{{ day.name }}</h3>
              <span>{{ day.day }}</span>
            </div>

            <div class="week-body">
              <div
                v-for="task in getTasksForDate(day.date)"
                :key="task.id"
                class="task-chip"
                @click="editTask(task)"
              >
                <span
                  class="task-dot"
                  :class="priorityClass(task.priority)"
                ></span>

                <span
                  class="task-title"
                  :title="task.title"
                >
                  {{ shortTitle(task.title) }}
                </span>
              </div>

              <span
                v-if="getTasksForDate(day.date).length === 0"
                class="week-empty"
              >
                Sin tareas
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else
        class="day-view"
      >
        <div class="day-header">
          <h2 class="day-title">
            {{ selectedDayTitle }}
          </h2>

          <div class="day-counter">
            {{ todayTasks.length }}
            {{ todayTasks.length === 1 ? 'tarea' : 'tareas' }}
          </div>
        </div>

        <div
          v-if="todayTasks.length > 0"
          class="day-list"
        >
          <article
            v-for="task in todayTasks"
            :key="task.id"
            class="day-card"
            @click="editTask(task)"
          >
            <div class="day-card-title">
              <span
                class="task-dot"
                :class="priorityClass(task.priority)"
              ></span>

              <span>
                {{ task.title }}
              </span>
            </div>

            <p class="day-description">
              {{ task.description }}
            </p>

            <div class="day-footer">
              <span>
                Responsable:
                <strong>{{ task.assignee }}</strong>
              </span>

              <span
                class="priority-badge"
                :class="priorityClass(task.priority)"
              >
                {{ task.priority }}
              </span>
            </div>
          </article>
        </div>

        <div
          v-else
          class="day-empty"
        >
          No hay tareas para este día.
        </div>
      </div>
    </div>
  </div>

  <TaskEditModal
    v-if="showEditModal && selectedTask"
    :task="selectedTask"
    @close="showEditModal = false"
    @save="updateTask"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next';
import { mockTasks } from '../data/mockTasks';
import TaskEditModal from '../components/TaskEditModal.vue';
import type { Task } from '../types';

const weekDays = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

const today = new Date();

const tasks = ref<Task[]>([...mockTasks]);

const showEditModal = ref(false);
const selectedTask = ref<Task | null>(null);

const currentDate = ref(
  new Date(
    today.getFullYear(),
    today.getMonth(),
    1,
  ),
);

const calendarView =
  ref<'day' | 'week' | 'month'>('month');

const currentMonth = computed(() => {
  const month =
    currentDate.value.toLocaleDateString(
      'es-ES',
      {
        month: 'long',
      },
    );

  const year =
    currentDate.value.getFullYear();

  return `${
    month.charAt(0).toUpperCase() +
    month.slice(1)
  } de ${year}`;
});

const calendarDays = computed(() => {
  const year =
    currentDate.value.getFullYear();

  const month =
    currentDate.value.getMonth();

  const firstDay =
    new Date(year, month, 1);

  const lastDay =
    new Date(year, month + 1, 0);

  const daysInMonth =
    lastDay.getDate();

  let startDay =
    firstDay.getDay();

  startDay =
    startDay === 0
      ? 6
      : startDay - 1;

  const previousMonthDays =
    new Date(
      year,
      month,
      0,
    ).getDate();

  const days: {
    day: number;
    currentMonth: boolean;
    isToday: boolean;
  }[] = [];

  for (
    let i = startDay;
    i > 0;
    i--
  ) {
    days.push({
      day:
        previousMonthDays -
        i +
        1,
      currentMonth: false,
      isToday: false,
    });
  }

  for (
    let i = 1;
    i <= daysInMonth;
    i++
  ) {
    days.push({
      day: i,
      currentMonth: true,
      isToday:
        i === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear(),
    });
  }

  let nextDay = 1;

  while (days.length < 42) {
    days.push({
      day: nextDay,
      currentMonth: false,
      isToday: false,
    });

    nextDay++;
  }

  return days;
});

const weekDaysData = computed(() => {
  const current =
    new Date(currentDate.value);

  const day =
    current.getDay();

  const diff =
    day === 0
      ? -6
      : 1 - day;

  current.setDate(
    current.getDate() + diff,
  );

  return Array.from(
    { length: 7 },
    (_, index) => {
      const date =
        new Date(current);

      date.setDate(
        current.getDate() + index,
      );

      return {
        name: weekDays[index],
        day: date.getDate(),
        date,
      };
    },
  );
});

const selectedDayTitle = computed(() => {
  return currentDate.value
    .toLocaleDateString(
      'es-ES',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      },
    )
    .replace(
      /^./,
      (letter) =>
        letter.toUpperCase(),
    );
});

const todayTasks = computed(() => {
  return getTasksForDate(
    currentDate.value,
  );
});

watch(
  calendarView,
  (view) => {
    if (
      view === 'week' ||
      view === 'day'
    ) {
      currentDate.value =
        new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        );
    }

    if (view === 'month') {
      currentDate.value =
        new Date(
          currentDate.value.getFullYear(),
          currentDate.value.getMonth(),
          1,
        );
    }
  },
);

function previousMonth() {
  if (
    calendarView.value === 'week'
  ) {
    currentDate.value =
      new Date(
        currentDate.value.getFullYear(),
        currentDate.value.getMonth(),
        currentDate.value.getDate() - 7,
      );

    return;
  }

  if (
    calendarView.value === 'day'
  ) {
    currentDate.value =
      new Date(
        currentDate.value.getFullYear(),
        currentDate.value.getMonth(),
        currentDate.value.getDate() - 1,
      );

    return;
  }

  currentDate.value =
    new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth() - 1,
      1,
    );
}

function nextMonth() {
  if (
    calendarView.value === 'week'
  ) {
    currentDate.value =
      new Date(
        currentDate.value.getFullYear(),
        currentDate.value.getMonth(),
        currentDate.value.getDate() + 7,
      );

    return;
  }

  if (
    calendarView.value === 'day'
  ) {
    currentDate.value =
      new Date(
        currentDate.value.getFullYear(),
        currentDate.value.getMonth(),
        currentDate.value.getDate() + 1,
      );

    return;
  }

  currentDate.value =
    new Date(
      currentDate.value.getFullYear(),
      currentDate.value.getMonth() + 1,
      1,
    );
}

function goToToday() {
  currentDate.value =
    new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
}

function editTask(task: Task) {
  selectedTask.value = task;
  showEditModal.value = true;
}

function updateTask(
  updatedTask: Task,
) {
  const index =
    tasks.value.findIndex(
      (task) =>
        task.id === updatedTask.id,
    );

  if (index === -1) {
    return;
  }

  tasks.value.splice(
    index,
    1,
    updatedTask,
  );

  showEditModal.value = false;
}

function getTasksForDay(
  day: number,
) {
  return tasks.value.filter(
    (task) => {
      const date =
        parseTaskDate(
          task.dueDate,
        );

      return (
        date.getDate() === day &&
        date.getMonth() ===
          currentDate.value.getMonth() &&
        date.getFullYear() ===
          currentDate.value.getFullYear()
      );
    },
  );
}

function getTasksForDate(
  targetDate: Date,
) {
  return tasks.value.filter(
    (task) => {
      const date =
        parseTaskDate(
          task.dueDate,
        );

      return (
        date.getDate() ===
          targetDate.getDate() &&
        date.getMonth() ===
          targetDate.getMonth() &&
        date.getFullYear() ===
          targetDate.getFullYear()
      );
    },
  );
}

function parseTaskDate(
  date: string,
) {
  return new Date(
    `${date}T00:00:00`,
  );
}

function priorityClass(
  priority: string,
) {
  return {
    high:
      priority === 'Alta',
    medium:
      priority === 'Media',
    low:
      priority === 'Baja',
  };
}

function shortTitle(
  title: string,
) {
  if (title.length <= 18) {
    return title;
  }

  return `${title.substring(
    0,
    18,
  )}...`;
}
</script>

<style scoped>
.calendar-page {
  width: 100%;
  max-width: 1300px;
  min-width: 0;
  min-height: 100vh;
  box-sizing: border-box;

  margin: 0 auto;

  padding: 32px 36px;
}

.page-header {
  margin-bottom: 28px;
}

.page-header h1 {
  margin: 0;

  font-size: 2rem;
  font-weight: 700;

  color: var(--color-text);
}

.page-header p {
  margin-top: 8px;

  color: var(
    --color-text-secondary
  );

  font-size: .95rem;
}

.calendar-card {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;

  padding: 28px;

  background: white;

  border-radius: 16px;

  box-shadow:
    var(--shadow-card);

  overflow: hidden;
}

.calendar-toolbar {
  display: flex;
  flex-direction: column;

  gap: 20px;

  margin-bottom: 28px;
  padding-bottom: 20px;

  border-bottom:
    1px solid #edf1f7;
}

.calendar-nav {
  display: grid;

  grid-template-columns:
    48px minmax(0, 1fr) 48px;

  align-items: center;

  gap: 16px;
}

.calendar-title {
  min-width: 0;

  margin: 0;

  text-align: center;

  color: var(--color-text);

  font-size: 1.6rem;
  font-weight: 700;
}

.month-btn {
  width: 48px;
  height: 48px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: none;
  border-radius: 50%;

  background:
    var(--color-structure-base);

  color: white;

  cursor: pointer;

  transition: opacity .2s;
}

.month-btn:hover {
  opacity: .9;
}

.view-switch {
  display: flex;
  align-items: center;
  justify-content: center;

  gap: 10px;
}

.calendar-btn {
  padding: 8px 14px;

  border: none;
  border-radius: 999px;

  background: transparent;

  color: var(--color-text);

  font-family:
    var(--font-sans);

  font-size: .9rem;
  font-weight: 600;

  cursor: pointer;

  transition: .2s;
}

.calendar-btn:hover {
  background: #f1f5f9;
}

.calendar-btn--active {
  background:
    var(--color-structure-base);

  color: white;

  box-shadow:
    0 3px 8px
    rgba(15, 23, 42, .15);
}

.calendar-btn--active:hover {
  background:
    var(--color-structure-base);
}

.calendar-grid {
  display: grid;

  grid-template-columns:
    repeat(
      7,
      minmax(0, 1fr)
    );

  grid-template-rows:
    auto repeat(6, 128px);

  gap: 10px;

  width: 100%;
  min-width: 0;
}

.weekday {
  padding: 4px;

  text-align: center;

  color: var(--color-text);

  font-size: .9rem;
  font-weight: 700;
}

.day-cell {
  min-width: 0;

  padding: 10px;

  box-sizing: border-box;

  overflow: hidden;

  border:
    1px solid #dbe3ef;

  border-radius: 12px;

  background: white;
}

.day-cell.today {
  background: #eff6ff;

  border-color:
    var(--color-structure-base);
}

.day-cell.outside {
  background: #f8fafc;

  color: #cbd5e1;
}

.day-cell-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mobile-weekday {
  display: none;
}

.day-number {
  color: inherit;

  font-size: .9rem;
  font-weight: 700;
}

.task-chip {
  display: flex;
  align-items: center;

  gap: 6px;

  min-width: 0;

  margin-top: 7px;

  cursor: pointer;
}

.task-dot {
  width: 8px;
  height: 8px;

  flex-shrink: 0;

  border-radius: 50%;
}

.task-dot.high,
.priority-badge.high {
  background: #ffe3e3;
  color: #c92a2a;
}

.task-dot.high {
  background: #ef4444;
}

.task-dot.medium,
.priority-badge.medium {
  background: #fff3bf;
  color: #e67700;
}

.task-dot.medium {
  background: #f59e0b;
}

.task-dot.low,
.priority-badge.low {
  background: #d3f9d8;
  color: #2b8a3e;
}

.task-dot.low {
  background: #22c55e;
}

.task-title {
  min-width: 0;

  overflow: hidden;

  white-space: nowrap;

  text-overflow: ellipsis;

  color: var(--color-text);

  font-size: .72rem;
}

.week-view {
  width: 100%;
  min-width: 0;
}

.week-grid {
  display: grid;

  grid-template-columns:
    repeat(
      7,
      minmax(0, 1fr)
    );

  gap: 10px;

  width: 100%;
  min-width: 0;
}

.week-column {
  min-width: 0;
  height: 360px;

  overflow: hidden;

  border:
    1px solid #dbe3ef;

  border-radius: 12px;

  background: white;
}

.week-header {
  padding: 14px 8px;

  text-align: center;

  border-bottom:
    1px solid #edf1f7;

  background: #f8fafc;
}

.week-header h3 {
  margin: 0;

  color: var(--color-text);

  font-size: .78rem;
  font-weight: 700;
}

.week-header span {
  display: block;

  margin-top: 5px;

  color:
    var(--color-structure-base);

  font-size: 1.25rem;
  font-weight: 700;
}

.week-body {
  padding: 10px;

  overflow: hidden;
}

.week-empty {
  display: block;

  margin-top: 8px;

  color:
    var(--color-text-secondary);

  text-align: center;

  font-size: .7rem;
}

.day-view {
  width: 100%;
  min-width: 0;

  min-height: 300px;
}

.day-header {
  margin-bottom: 24px;
}

.day-title {
  margin: 0;

  color: var(--color-text);

  font-size: 1.6rem;
  font-weight: 700;
}

.day-counter {
  margin-top: 10px;

  color:
    var(--color-text-secondary);

  font-size: .9rem;
}

.day-list {
  display: flex;
  flex-direction: column;

  gap: 14px;
}

.day-card {
  padding: 20px;

  border:
    1px solid #dbe3ef;

  border-radius: 14px;

  background: #fff;

  cursor: pointer;

  transition:
    box-shadow .2s,
    transform .2s;
}

.day-card:hover {
  transform:
    translateY(-1px);

  box-shadow:
    0 6px 16px
    rgba(15, 23, 42, .08);
}

.day-card-title {
  display: flex;
  align-items: center;

  gap: 10px;

  color: var(--color-text);

  font-size: 1.1rem;
  font-weight: 700;
}

.day-description {
  margin: 14px 0;

  color:
    var(--color-text-secondary);

  line-height: 1.5;
}

.day-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 16px;

  margin-top: 18px;

  color:
    var(--color-text-secondary);

  font-size: .85rem;
}

.priority-badge {
  padding: 5px 10px;

  border-radius: 999px;

  font-size: .75rem;
  font-weight: 600;
}

.day-empty {
  padding: 48px 20px;

  text-align: center;

  color:
    var(--color-text-secondary);

  border:
    1px dashed #dbe3ef;

  border-radius: 12px;
}

@media (max-width: 900px) {
  .calendar-page {
    padding: 20px 16px;
  }

  .page-header {
    margin-bottom: 20px;
  }

  .page-header h1 {
    font-size: 1.6rem;
  }

  .page-header p {
    font-size: .88rem;
    line-height: 1.4;
  }

  .calendar-card {
    padding: 20px;
  }

  .calendar-toolbar {
    gap: 16px;

    margin-bottom: 18px;
    padding-bottom: 16px;
  }

  .calendar-nav {
    grid-template-columns:
      40px minmax(0, 1fr) 40px;

    gap: 12px;
  }

  .calendar-title {
    font-size: 1.3rem;
    line-height: 1.25;
  }

  .month-btn {
    width: 38px;
    height: 38px;
  }

  .view-switch {
    width: 100%;

    gap: 6px;
  }

  .calendar-btn {
    padding: 7px 12px;

    font-size: .8rem;
  }

  .calendar-grid {
    grid-template-columns:
      repeat(
        4,
        minmax(0, 1fr)
      );

    grid-template-rows: none;

    grid-auto-rows: 110px;

    gap: 8px;
  }

  .weekday {
    display: none;
  }

  .mobile-weekday {
    display: block;

    color:
      var(--color-text-secondary);

    font-size: .65rem;
    font-weight: 600;
  }

  .day-cell {
    height: 110px;

    padding: 8px;
  }

  .day-number {
    font-size: .8rem;
  }

  .task-chip {
    margin-top: 5px;
  }

  .task-title {
    font-size: .66rem;
  }

  .week-grid {
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );

    gap: 10px;
  }

  .week-column {
    height: 260px;
  }

  .week-header {
    padding: 12px 8px;
  }

  .week-header h3 {
    font-size: .8rem;
  }

  .week-header span {
    font-size: 1.1rem;
  }

  .day-title {
    font-size: 1.4rem;
  }

  .day-card {
    padding: 18px;
  }
}

@media (max-width: 600px) {
  .calendar-page {
    padding: 20px 16px;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }

  .page-header p {
    font-size: .82rem;
  }

  .calendar-card {
    padding: 16px 12px;

    border-radius: 14px;
  }

  .calendar-toolbar {
    gap: 14px;
  }

  .calendar-nav {
    grid-template-columns:
      34px minmax(0, 1fr) 34px;

    gap: 8px;
  }

  .calendar-title {
    font-size: 1rem;
    line-height: 1.25;
  }

  .month-btn {
    width: 32px;
    height: 32px;
  }

  .view-switch {
    display: grid;

    grid-template-columns:
      repeat(
        4,
        minmax(0, 1fr)
      );

    gap: 4px;
  }

  .calendar-btn {
    width: 100%;

    padding: 6px 3px;

    font-size: .68rem;
  }

  .calendar-grid {
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );

    grid-auto-rows: 92px;

    gap: 7px;
  }

  .day-cell {
    height: 92px;

    padding: 7px;

    border-radius: 9px;
  }

  .mobile-weekday {
    font-size: .58rem;
  }

  .day-number {
    font-size: .72rem;
  }

  .task-chip {
    margin-top: 4px;

    gap: 4px;
  }

  .task-dot {
    width: 6px;
    height: 6px;
  }

  .task-title {
    font-size: .58rem;
  }

  .week-grid {
    grid-template-columns: 1fr;

    gap: 10px;
  }

  .week-column {
    height: auto;

    min-height: 110px;
  }

  .week-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: 10px 12px;

    text-align: left;
  }

  .week-header h3 {
    font-size: .8rem;
  }

  .week-header span {
    margin: 0;

    font-size: 1rem;
  }

  .week-body {
    min-height: 55px;

    padding: 10px 12px;
  }

  .week-empty {
    text-align: left;
  }

  .day-header {
    margin-bottom: 18px;
  }

  .day-title {
    font-size: 1.15rem;
    line-height: 1.3;
  }

  .day-counter {
    margin-top: 8px;

    font-size: .8rem;
  }

  .day-list {
    gap: 10px;
  }

  .day-card {
    padding: 14px;

    border-radius: 12px;
  }

  .day-card-title {
    gap: 8px;

    font-size: .95rem;
  }

  .day-description {
    margin: 10px 0;

    font-size: .8rem;
    line-height: 1.45;
  }

  .day-footer {
    flex-direction: column;
    align-items: flex-start;

    gap: 8px;

    margin-top: 14px;

    font-size: .75rem;
  }

  .priority-badge {
    padding: 5px 9px;

    font-size: .7rem;
  }

  .day-empty {
    padding: 36px 16px;

    font-size: .82rem;
  }
}
</style>