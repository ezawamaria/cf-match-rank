<script setup lang="ts">
const props = withDefaults(defineProps<{
  startDate: string;
  endDate: string;
  placeholder?: string;
  inputClass?: string;
}>(), {
  placeholder: '选择日期范围',
  inputClass: '',
});

const emit = defineEmits<{
  'update:startDate': [value: string];
  'update:endDate': [value: string];
}>();

const inputRef = ref<HTMLInputElement | null>(null);
let picker: { setDate: (dates: string[], triggerChange?: boolean, format?: string) => void; destroy: () => void } | null = null;
let removeCalendarClickListener: (() => void) | null = null;

const ensureFlatpickrAssets = async () => {
  if (!import.meta.client) return;

  if (!document.querySelector('link[data-flatpickr-css="true"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css';
    link.dataset.flatpickrCss = 'true';
    document.head.appendChild(link);
  }

  if (!(window as any).flatpickr) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/flatpickr';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('flatpickr 脚本加载失败'));
      document.head.appendChild(script);
    });
  }

  await new Promise<void>((resolve, reject) => {
    if (document.querySelector('script[data-flatpickr-locale-zh="true"]')) {
      resolve();
      return;
    }

    const localeScript = document.createElement('script');
    localeScript.src = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/zh.js';
    localeScript.async = true;
    localeScript.dataset.flatpickrLocaleZh = 'true';
    localeScript.onload = () => resolve();
    localeScript.onerror = () => reject(new Error('flatpickr 中文语言包加载失败'));
    document.head.appendChild(localeScript);
  });
};

const applyModelToPicker = () => {
  if (!picker) return;

  const dates: string[] = [];
  if (props.startDate) dates.push(props.startDate);
  if (props.endDate) dates.push(props.endDate);
  picker.setDate(dates, false, 'Y-m-d');
};

onMounted(async () => {
  if (!inputRef.value) return;

  await ensureFlatpickrAssets();
  const flatpickr = (window as any).flatpickr;
  if (!flatpickr) return;

  picker = flatpickr(inputRef.value, {
    mode: 'range',
    dateFormat: 'Y-m-d',
    allowInput: false,
    disableMobile: true,
    locale: 'zh',
    onReady: (_selectedDates: Date[], _dateStr: string, instance: any) => {
      const clickHandler = (event: Event) => {
        const target = event.target as HTMLElement | null;
        const dayElement = target?.closest('.flatpickr-day') as (HTMLElement & { dateObj?: Date }) | null;

        if (!dayElement?.dateObj) return;
        if (!instance.selectedDates || instance.selectedDates.length !== 1) return;

        const selectedDate = instance.selectedDates[0];
        const clickedDate = dayElement.dateObj;
        if (selectedDate.getTime() !== clickedDate.getTime()) return;

        instance.setDate([selectedDate, selectedDate], true, 'Y-m-d');
        instance.close();
      };

      instance.calendarContainer?.addEventListener('click', clickHandler);
      removeCalendarClickListener = () => {
        instance.calendarContainer?.removeEventListener('click', clickHandler);
      };
    },
    onChange: (selectedDates: Date[], dateStr: string) => {
      if (selectedDates.length === 0 || dateStr === '') {
        emit('update:startDate', '');
        emit('update:endDate', '');
        return;
      }

      const [startDate = '', endDate = ''] = dateStr.split(' to ');
      emit('update:startDate', startDate);
      emit('update:endDate', endDate || startDate);
    },
  });

  applyModelToPicker();
});

watch(() => [props.startDate, props.endDate], () => {
  applyModelToPicker();
});

onBeforeUnmount(() => {
  removeCalendarClickListener?.();
  removeCalendarClickListener = null;
  picker?.destroy();
  picker = null;
});
</script>

<template>
  <input
    ref="inputRef"
    type="text"
    :placeholder="placeholder"
    :class="inputClass"
  >
</template>
