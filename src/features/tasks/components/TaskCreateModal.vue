<template>
  <div class="modal-overlay">
    <div class="modal">

      <div class="modal-header">
        <h2>Nueva tarea</h2>

        <button
          class="close-btn"
          @click="emit('close')"
        >
          <X :size="22" />
        </button>
      </div>

      <div class="modal-body">
        <div class="form-layout">

          <div class="form-section">
            <h3>Información general</h3>

            <div class="form-group">
              <label>Título</label>

              <input
                v-model="title"
                type="text"
                placeholder="Ej. Actualizar inventario"
              />
            </div>

            <div class="form-group">
              <label>Descripción</label>

              <textarea
                v-model="description"
                rows="4"
                placeholder="Describe la tarea..."
              ></textarea>
            </div>
          </div>

          <div class="form-section">
            <h3>Detalles</h3>

            <div class="form-group">
              <label>Responsable</label>

              <details
                ref="assigneeDropdown"
                class="custom-select"
              >
                <summary class="custom-select__trigger">
                  {{ assignee }}
                </summary>

                <div class="custom-select__options">
                  <button
                    v-for="person in assigneeOptions"
                    :key="person"
                    type="button"
                    class="custom-select__option"
                    :class="{
                      'custom-select__option--active':
                        assignee === person
                    }"
                    @click="changeAssignee(person)"
                  >
                    {{ person }}
                  </button>
                </div>
              </details>
            </div>

            <div class="form-group">
              <label>Prioridad</label>

              <details
                ref="priorityDropdown"
                class="custom-select"
              >
                <summary class="custom-select__trigger">
                  {{ priority }}
                </summary>

                <div class="custom-select__options">
                  <button
                    v-for="option in priorityOptions"
                    :key="option"
                    type="button"
                    class="custom-select__option"
                    :class="{
                      'custom-select__option--active':
                        priority === option
                    }"
                    @click="changePriority(option)"
                  >
                    {{ option }}
                  </button>
                </div>
              </details>
            </div>

            <div class="form-group">
              <label>Fecha límite</label>

              <details
                ref="dateDropdown"
                class="date-picker"
              >
                <summary class="date-picker__trigger">
                  <span
                    :class="{
                      'date-picker__placeholder': !dueDate
                    }"
                  >
                    {{ formattedDueDate }}
                  </span>

                  <CalendarDays :size="17" />
                </summary>

                <div class="date-picker__calendar">

                  <div class="calendar-header">
                    <button
                      type="button"
                      class="calendar-nav"
                      @click.prevent="previousMonth"
                    >
                      ‹
                    </button>

                    <strong>
                      {{ calendarMonthLabel }}
                    </strong>

                    <button
                      type="button"
                      class="calendar-nav"
                      @click.prevent="nextMonth"
                    >
                      ›
                    </button>
                  </div>

                  <div class="calendar-weekdays">
                    <span>Do</span>
                    <span>Lu</span>
                    <span>Ma</span>
                    <span>Mi</span>
                    <span>Ju</span>
                    <span>Vi</span>
                    <span>Sa</span>
                  </div>

                  <div class="calendar-days">
                    <span
                      v-for="blank in calendarStartOffset"
                      :key="`blank-${blank}`"
                      class="calendar-day calendar-day--empty"
                    ></span>

                    <button
                      v-for="day in calendarDays"
                      :key="day"
                      type="button"
                      class="calendar-day"
                      :class="{
                        'calendar-day--selected':
                          isSelectedDay(day),
                        'calendar-day--today':
                          isToday(day)
                      }"
                      @click="selectDate(day)"
                    >
                      {{ day }}
                    </button>
                  </div>

                  <div class="calendar-footer">
                    <button
                      type="button"
                      class="calendar-footer-btn"
                      @click="clearDate"
                    >
                      Borrar
                    </button>

                    <button
                      type="button"
                      class="calendar-footer-btn"
                      @click="selectToday"
                    >
                      Hoy
                    </button>
                  </div>

                </div>
              </details>
            </div>

          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button
          class="btn-cancel"
          @click="emit('close')"
        >
          Cancelar
        </button>

        <button
          class="btn-create"
          @click="createTask"
        >
          Crear tarea
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { X, CalendarDays } from 'lucide-vue-next';
import type { Task } from '../types';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'create', task: Task): void;
}>();

const title = ref('');
const description = ref('');
const assignee = ref('Sin asignar');
const priority = ref<Task['priority']>('Sin prioridad');
const dueDate = ref('');

const assigneeDropdown =
  ref<HTMLDetailsElement | null>(null);

const priorityDropdown =
  ref<HTMLDetailsElement | null>(null);

const dateDropdown =
  ref<HTMLDetailsElement | null>(null);

const assigneeOptions = [
  'Sin asignar',
  'María',
  'Juan',
  'Andrea',
  'Josué',
];

const priorityOptions: Task['priority'][] = [
  'Sin prioridad',
  'Alta',
  'Media',
  'Baja',
];

const today = new Date();

const calendarYear =
  ref(today.getFullYear());

const calendarMonth =
  ref(today.getMonth());

const monthNames = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const calendarMonthLabel = computed(() => {
  return `${monthNames[calendarMonth.value]} ${calendarYear.value}`;
});

const calendarDays = computed(() => {
  return new Date(
    calendarYear.value,
    calendarMonth.value + 1,
    0,
  ).getDate();
});

const calendarStartOffset = computed(() => {
  return new Date(
    calendarYear.value,
    calendarMonth.value,
    1,
  ).getDay();
});

const formattedDueDate = computed(() => {
  if (!dueDate.value) {
    return 'dd/mm/aaaa';
  }

  const [year, month, day] =
    dueDate.value.split('-');

  return `${day}/${month}/${year}`;
});

function changeAssignee(person: string) {
  assignee.value = person;

  if (assigneeDropdown.value) {
    assigneeDropdown.value.open = false;
  }
}

function changePriority(
  option: Task['priority'],
) {
  priority.value = option;

  if (priorityDropdown.value) {
    priorityDropdown.value.open = false;
  }
}

function previousMonth() {
  if (calendarMonth.value === 0) {
    calendarMonth.value = 11;
    calendarYear.value--;
  } else {
    calendarMonth.value--;
  }
}

function nextMonth() {
  if (calendarMonth.value === 11) {
    calendarMonth.value = 0;
    calendarYear.value++;
  } else {
    calendarMonth.value++;
  }
}

function selectDate(day: number) {
  const month =
    String(calendarMonth.value + 1)
      .padStart(2, '0');

  const formattedDay =
    String(day).padStart(2, '0');

  dueDate.value =
    `${calendarYear.value}-${month}-${formattedDay}`;

  if (dateDropdown.value) {
    dateDropdown.value.open = false;
  }
}

function isSelectedDay(day: number) {
  if (!dueDate.value) {
    return false;
  }

  const month =
    String(calendarMonth.value + 1)
      .padStart(2, '0');

  const formattedDay =
    String(day).padStart(2, '0');

  return (
    dueDate.value ===
    `${calendarYear.value}-${month}-${formattedDay}`
  );
}

function isToday(day: number) {
  return (
    day === today.getDate() &&
    calendarMonth.value === today.getMonth() &&
    calendarYear.value === today.getFullYear()
  );
}

function clearDate() {
  dueDate.value = '';

  if (dateDropdown.value) {
    dateDropdown.value.open = false;
  }
}

function selectToday() {
  calendarYear.value =
    today.getFullYear();

  calendarMonth.value =
    today.getMonth();

  const month =
    String(today.getMonth() + 1)
      .padStart(2, '0');

  const day =
    String(today.getDate())
      .padStart(2, '0');

  dueDate.value =
    `${today.getFullYear()}-${month}-${day}`;

  if (dateDropdown.value) {
    dateDropdown.value.open = false;
  }
}

function createTask() {
  if (!title.value.trim()) {
    alert('Debes ingresar un título.');
    return;
  }

  const newTask: Task = {
    id: Date.now(),
    title: title.value,
    description: description.value,
    assignee: assignee.value,
    priority: priority.value,
    status: 'Pendiente',
    dueDate:
      dueDate.value ||
      new Date().toISOString().split('T')[0],
  };

  emit('create', newTask);

  title.value = '';
  description.value = '';
  assignee.value = 'Sin asignar';
  priority.value = 'Sin prioridad';
  dueDate.value = '';

  emit('close');
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal {
  width: 700px;
  max-width: 90vw;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, .18);
  overflow: visible;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22px 28px;
  border-bottom: 1px solid #edf1f7;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.6rem;
  color: var(--color-text);
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #8fa3c1;
  display: flex;
  align-items: center;
}

.modal-body {
  padding: 20px 26px;
}

.form-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  align-items: start;
}

.form-section {
  min-width: 0;
}

.form-section h3 {
  margin: 0 0 14px;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 14px;
  min-width: 0;
}

.form-group label {
  margin-bottom: 6px;
  font-weight: 600;
  color: var(--color-text);
  font-size: .9rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 11px 14px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  font-size: .9rem;
  font-family: var(--font-sans);
  background: white;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-structure-base);
}

.form-group textarea {
  resize: none;
  height: 145px;
}

.custom-select {
  position: relative;
  width: 100%;
}

.custom-select summary {
  list-style: none;
}

.custom-select summary::-webkit-details-marker {
  display: none;
}

.custom-select__trigger {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  padding: 11px 34px 11px 14px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: white;
  color: var(--color-text);
  font-size: .9rem;
  font-family: var(--font-sans);
  cursor: pointer;
  user-select: none;
}

.custom-select__trigger::after {
  content: '⌄';
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-55%);
  color: #8fa3c1;
}

.custom-select[open]
.custom-select__trigger {
  border-radius: 8px 8px 0 0;
}

.custom-select__options {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 70;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: white;
  border: 1px solid #dbe3ef;
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 8px 16px rgba(15, 23, 42, .12);
  overflow: hidden;
}

.custom-select__option {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  background: white;
  color: var(--color-text);
  text-align: left;
  font-family: var(--font-sans);
  font-size: .9rem;
  cursor: pointer;
}

.custom-select__option:last-child {
  border-bottom: none;
}

.custom-select__option:hover {
  background: #f8fafc;
}

.custom-select__option--active {
  background: #eff6ff;
  color: var(--color-structure-base);
  font-weight: 600;
}

.date-picker {
  position: relative;
  width: 100%;
}

.date-picker summary {
  list-style: none;
}

.date-picker summary::-webkit-details-marker {
  display: none;
}

.date-picker__trigger {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 14px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: white;
  color: var(--color-text);
  font-size: .9rem;
  font-family: var(--font-sans);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.date-picker__placeholder {
  color: var(--color-text);
}

.date-picker__calendar {
  position: absolute;
  bottom: calc(100% + 6px);
  right: 0;
  z-index: 80;
  width: 280px;
  max-width: min(280px, calc(100vw - 32px));
  box-sizing: border-box;
  padding: 14px;
  background: white;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, .16);
}

.calendar-header {
  display: grid;
  grid-template-columns: 34px 1fr 34px;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  text-align: center;
}

.calendar-header strong {
  font-size: .9rem;
  color: var(--color-text);
}

.calendar-nav {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 8px;
  background: #f8fafc;
  color: var(--color-text);
  font-size: 1.3rem;
  cursor: pointer;
}

.calendar-nav:hover {
  background: #eef2f7;
}

.calendar-weekdays,
.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-days {
  grid-template-rows: repeat(6, 1fr);
  min-height: 210px;
}

.calendar-weekdays {
  margin-bottom: 6px;
}

.calendar-weekdays span {
  padding: 5px 0;
  text-align: center;
  color: var(--color-structure-base);
  font-size: .72rem;
  font-weight: 700;
}

.calendar-day {
  width: 100%;
  height: 32px;
  min-width: 0;
  align-self: center;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--color-text);
  font-size: .8rem;
  font-family: var(--font-sans);
  cursor: pointer;
}

.calendar-day:hover {
  background: #f1f5f9;
}

.calendar-day--empty {
  pointer-events: none;
}

.calendar-day--today {
  border: 1px solid var(--color-structure-base);
}

.calendar-day--selected {
  background: var(--color-structure-base);
  color: white;
  font-weight: 700;
}

.calendar-day--selected:hover {
  background: var(--color-structure-base);
}

.calendar-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #edf1f7;
}

.calendar-footer-btn {
  padding: 6px 8px;
  border: none;
  background: transparent;
  color: var(--color-structure-base);
  font-family: var(--font-sans);
  font-size: .8rem;
  font-weight: 600;
  cursor: pointer;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 26px;
  border-top: 1px solid #edf1f7;
}

.btn-cancel {
  padding: 10px 18px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-weight: 600;
  transition: .2s;
}

.btn-cancel:hover {
  background: #f8fafc;
}

.btn-create {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: var(--color-structure-base);
  color: white;
  cursor: pointer;
  font-weight: 600;
  transition: .2s;
}

.btn-create:hover {
  opacity: .92;
}

@media (max-width: 850px) {
  .modal-overlay {
    padding: 16px;
    box-sizing: border-box;
  }

  .modal {
    width: min(700px, 100%);
    max-width: 100%;
    max-height: calc(100vh - 32px);
    overflow-y: auto;
    box-sizing: border-box;
  }

  .modal-header {
    padding: 18px 22px;
  }

  .modal-body {
    padding: 18px 22px;
  }

  .modal-footer {
    padding: 14px 22px;
  }

  .form-layout {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    gap: 18px;
  }
}

@media (max-width: 600px) {
  .modal-overlay {
    padding: 12px;
    align-items: center;
  }

  .modal {
    width: 100%;
    max-height: calc(100vh - 24px);
    border-radius: 14px;
  }

  .modal-header {
    padding: 16px 20px;
  }

  .modal-header h2 {
    font-size: 1.35rem;
  }

  .modal-body {
    padding: 16px 20px;
  }

  .form-layout {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .form-group textarea {
    height: 110px;
  }

  .modal-footer {
    padding: 14px 20px;
  }

  .date-picker__calendar {
    left: 0;
    right: auto;
    width: 100%;
    max-width: 100%;
  }
}
</style>