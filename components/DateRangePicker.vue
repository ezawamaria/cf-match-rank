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

interface FlatpickrInstance {
  selectedDates: Date[];
  calendarContainer?: HTMLElement;
  setDate: (dates: string[] | Date[], triggerChange?: boolean, format?: string) => void;
  clear: (emitChangeEvent?: boolean, toInitial?: boolean) => void;
  formatDate: (dateObj: Date, frmt: string) => string;
  close: () => void;
  destroy: () => void;
}

type FlatpickrFn = (
  element: HTMLElement,
  options: Record<string, unknown>,
) => FlatpickrInstance;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ASSET_TIMEOUT_MS = 10000;
const FLATPICKR_SCRIPT_CANDIDATES = [
  'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.js',
  'https://unpkg.com/flatpickr/dist/flatpickr.min.js',
];
const FLATPICKR_STYLE_CANDIDATES = [
  'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css',
  'https://unpkg.com/flatpickr/dist/flatpickr.min.css',
];
const FLATPICKR_LOCALE_ZH_CANDIDATES = [
  'https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/zh.js',
  'https://unpkg.com/flatpickr/dist/l10n/zh.js',
];

const inputRef = ref<HTMLInputElement | null>(null);
const pickerReady = ref(false);
let picker: FlatpickrInstance | null = null;
let removeDayDoubleClickListener: (() => void) | null = null;
let removeClearButtonListener: (() => void) | null = null;
let panelBindFrameId: number | null = null;
let selectionTipElement: HTMLSpanElement | null = null;
let flatpickrLocaleEnabled = false;

const normalizeManualRangeInput = (value: string) => {
  const normalized = value
    .trim()
    .replace(/\s+/g, '')
    .replace(/至|~|—|–/g, 'to')
    .replace(/,/g, 'to');

  if (!normalized) return ['', ''] as const;

  const matchedDates = normalized.match(/\d{4}-\d{2}-\d{2}/g) || [];
  if (matchedDates.length === 1) {
    const [date] = matchedDates;
    if (!isValidYmd(date)) return ['', ''] as const;
    return [date, ''] as const;
  }

  if (matchedDates.length >= 2) {
    const startDate = matchedDates[0];
    const endDate = matchedDates[1];
    if (!isValidYmd(startDate) || !isValidYmd(endDate)) return ['', ''] as const;
    return endDate < startDate
      ? [endDate, startDate] as const
      : [startDate, endDate] as const;
  }

  return ['', ''] as const;
};

const START_DATE_TIP = '请选择开始日期';
const END_DATE_TIP = '请选择结束日期';

const isValidYmd = (value: string) => {
  if (!DATE_RE.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
};

const getModelDates = () => {
  const startDate = isValidYmd(props.startDate) ? props.startDate : '';
  const endDate = isValidYmd(props.endDate) ? props.endDate : '';

  if (startDate && endDate && endDate < startDate) {
    return [endDate, startDate] as const;
  }

  return [startDate, endDate] as const;
};

const withTimeout = (promise: Promise<void>, label: string) => Promise.race([
  promise,
  new Promise<void>((_, reject) => {
    setTimeout(() => reject(new Error(`${label} 加载超时`)), ASSET_TIMEOUT_MS);
  }),
]);

const loadScriptFromCandidates = async (selector: string, sources: string[], datasetKey: string) => {
  const existingScript = document.querySelector<HTMLScriptElement>(selector);
  if (existingScript) {
    if (existingScript.dataset.loaded === 'true') return true;

    await withTimeout(new Promise<void>((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error(`${existingScript.src} 加载失败`)), { once: true });
    }), existingScript.src);
    return true;
  }

  for (const src of sources) {
    try {
      await withTimeout(new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.dataset[datasetKey] = 'true';
        script.addEventListener('load', () => {
          script.dataset.loaded = 'true';
          resolve();
        }, { once: true });
        script.addEventListener('error', () => {
          script.remove();
          reject(new Error(`${src} 加载失败`));
        }, { once: true });
        document.head.appendChild(script);
      }), src);
      return true;
    } catch (error) {
      console.warn(`[DateRangePicker] ${src} 加载失败，尝试下一资源源。`, error);
    }
  }

  return false;
};

const ensureStyle = async () => {
  if (document.querySelector('link[data-flatpickr-css="true"]')) return true;

  for (const href of FLATPICKR_STYLE_CANDIDATES) {
    try {
      await withTimeout(new Promise<void>((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.flatpickrCss = 'true';
        link.addEventListener('load', () => resolve(), { once: true });
        link.addEventListener('error', () => {
          link.remove();
          reject(new Error(`${href} 加载失败`));
        }, { once: true });
        document.head.appendChild(link);
      }), href);
      return true;
    } catch (error) {
      console.warn(`[DateRangePicker] ${href} 加载失败，尝试下一样式源。`, error);
    }
  }

  return false;
};

const ensureFlatpickrAssets = async () => {
  if (!import.meta.client) return false;

  const cssReady = await ensureStyle();
  if (!cssReady) {
    console.warn('[DateRangePicker] flatpickr 样式资源加载失败。');
  }

  const coreReady = await loadScriptFromCandidates(
    'script[data-flatpickr-core="true"]',
    FLATPICKR_SCRIPT_CANDIDATES,
    'flatpickrCore',
  );
  if (!coreReady) {
    console.error('[DateRangePicker] flatpickr 核心脚本加载失败，将回退为手动输入模式。');
    return false;
  }

  const win = window as typeof window & { flatpickr?: FlatpickrFn & { l10ns?: { zh?: unknown } } };
  if (!win.flatpickr) {
    console.error('[DateRangePicker] flatpickr 全局对象未就绪，将回退为手动输入模式。');
    return false;
  }

  flatpickrLocaleEnabled = false;
  const localeReady = await loadScriptFromCandidates(
    'script[data-flatpickr-locale-zh="true"]',
    FLATPICKR_LOCALE_ZH_CANDIDATES,
    'flatpickrLocaleZh',
  );
  if (localeReady && win.flatpickr.l10ns?.zh) {
    flatpickrLocaleEnabled = true;
  }

  return true;
};

const getDisplayText = () => {
  const [startDate, endDate] = getModelDates();
  if (!startDate && !endDate) return '';
  if (startDate && !endDate) return startDate;
  return `${startDate} 至 ${endDate}`;
};

const syncFromManualInput = (event: Event) => {
  if (pickerReady.value) return;
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;

  const [startDate, endDate] = normalizeManualRangeInput(target.value);
  emit('update:startDate', startDate);
  emit('update:endDate', endDate);
  target.value = startDate && endDate ? `${startDate} 至 ${endDate}` : startDate;
};

const applyModelToPicker = () => {
  if (!picker) return;

  const [startDate, endDate] = getModelDates();
  const nextDates = [startDate, endDate].filter(Boolean);
  const currentDates = picker.selectedDates
    .map((date) => picker?.formatDate(date, 'Y-m-d') || '')
    .filter(Boolean);

  if (nextDates.length === currentDates.length && nextDates.every((value, index) => value === currentDates[index])) {
    return;
  }

  if (nextDates.length === 0) {
    picker.clear(false);
    return;
  }

  picker.setDate(nextDates, false, 'Y-m-d');
};

const bindDayDoubleClick = () => {
  if (!picker?.calendarContainer) return;

  removeDayDoubleClickListener?.();

  const handleDayDoubleClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const dayElement = target.closest('.flatpickr-day');
    if (!(dayElement instanceof HTMLElement)) return;
    if (dayElement.classList.contains('flatpickr-disabled')) return;

    const dayDate = (dayElement as HTMLElement & { dateObj?: Date }).dateObj;
    if (!(dayDate instanceof Date) || !Number.isFinite(dayDate.getTime()) || !picker) return;

    const ymd = picker.formatDate(dayDate, 'Y-m-d');
    picker.setDate([ymd, ymd], true, 'Y-m-d');
    picker.close();
  };

  picker.calendarContainer.addEventListener('dblclick', handleDayDoubleClick);
  removeDayDoubleClickListener = () => {
    picker?.calendarContainer?.removeEventListener('dblclick', handleDayDoubleClick);
  };
};

const bindClearButton = () => {
  if (!picker?.calendarContainer) return;

  removeClearButtonListener?.();

  const calendar = picker.calendarContainer;
  let actionContainer = calendar.querySelector<HTMLElement>('.flatpickr-panel-actions');
  if (!actionContainer) {
    actionContainer = document.createElement('div');
    actionContainer.className = 'flatpickr-panel-actions';
    calendar.appendChild(actionContainer);
  }

  let selectionTip = actionContainer.querySelector<HTMLSpanElement>('.flatpickr-selection-tip');
  if (!selectionTip) {
    selectionTip = document.createElement('span');
    selectionTip.className = 'flatpickr-selection-tip';
    actionContainer.appendChild(selectionTip);
  }
  selectionTipElement = selectionTip;

  let clearButton = actionContainer.querySelector<HTMLButtonElement>('.flatpickr-clear-btn');
  if (!clearButton) {
    clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.className = 'flatpickr-clear-btn';
    clearButton.textContent = '清空';
    actionContainer.appendChild(clearButton);
  }

  const handleClearClick = () => {
    if (!picker) return;
    picker.clear(true);
    picker.close();
  };

  clearButton.addEventListener('click', handleClearClick);
  removeClearButtonListener = () => {
    clearButton?.removeEventListener('click', handleClearClick);
  };
};

const updateSelectionTip = () => {
  if (!selectionTipElement || !picker) return;

  const validDates = picker.selectedDates.filter((date) => Number.isFinite(date.getTime()));
  selectionTipElement.textContent = validDates.length === 1 ? END_DATE_TIP : START_DATE_TIP;
};

const bindPanelEnhancements = () => {
  bindDayDoubleClick();
  bindClearButton();
  updateSelectionTip();
};

const queueBindPanelEnhancements = () => {
  if (!picker?.calendarContainer) return;

  if (panelBindFrameId !== null) {
    cancelAnimationFrame(panelBindFrameId);
    panelBindFrameId = null;
  }

  panelBindFrameId = requestAnimationFrame(() => {
    panelBindFrameId = requestAnimationFrame(() => {
      bindPanelEnhancements();
      panelBindFrameId = null;
    });
  });
};

onMounted(async () => {
  if (!inputRef.value) return;

  const isReady = await ensureFlatpickrAssets();
  const flatpickr = (window as typeof window & { flatpickr?: FlatpickrFn }).flatpickr;
  if (!isReady || !flatpickr) return;

  picker = flatpickr(inputRef.value, {
    mode: 'range',
    dateFormat: 'Y-m-d',
    allowInput: false,
    // 在移动端保留 flatpickr 面板，避免 readonly 输入触发原生日期框失败导致无法点击。
    disableMobile: true,
    clickOpens: true,
    appendTo: document.body,
    positionElement: inputRef.value,
    locale: flatpickrLocaleEnabled ? 'zh' : undefined,
    onChange: (selectedDates: Date[]) => {
      const validDates = selectedDates.filter((date) => Number.isFinite(date.getTime()));
      if (validDates.length === 0) {
        emit('update:startDate', '');
        emit('update:endDate', '');
        updateSelectionTip();
        return;
      }

      const startDate = picker?.formatDate(validDates[0], 'Y-m-d') || '';
      const endDate = validDates[1]
        ? picker?.formatDate(validDates[1], 'Y-m-d') || ''
        : '';
      emit('update:startDate', startDate);
      emit('update:endDate', endDate);
      updateSelectionTip();
    },
    onReady: () => {
      pickerReady.value = true;
      queueBindPanelEnhancements();
    },
    onOpen: () => {
      queueBindPanelEnhancements();
    },
    onMonthChange: () => {
      queueBindPanelEnhancements();
    },
    onYearChange: () => {
      queueBindPanelEnhancements();
    },
  });

  applyModelToPicker();
});

watch(() => [props.startDate, props.endDate], () => {
  if (!pickerReady.value) return;
  applyModelToPicker();
  updateSelectionTip();
});

onBeforeUnmount(() => {
  removeDayDoubleClickListener?.();
  removeDayDoubleClickListener = null;
  removeClearButtonListener?.();
  removeClearButtonListener = null;
  if (panelBindFrameId !== null) {
    cancelAnimationFrame(panelBindFrameId);
    panelBindFrameId = null;
  }
  selectionTipElement = null;
  picker?.destroy();
  picker = null;
});
</script>

<template>
  <input
    ref="inputRef"
    type="text"
    :placeholder="placeholder"
    :value="getDisplayText()"
    :class="inputClass"
    :readonly="pickerReady"
    @change="syncFromManualInput"
  >
</template>

<style>
.flatpickr-calendar .flatpickr-panel-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 40px;
  padding: 8px;
  border-top: 1px solid #e5e7eb;
}

.flatpickr-calendar .flatpickr-selection-tip {
  color: #6b7280;
  font-size: 12px;
  line-height: 1;
}

.flatpickr-calendar .flatpickr-clear-btn {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1;
  padding: 6px 10px;
  cursor: pointer;
}

.flatpickr-calendar .flatpickr-clear-btn:hover {
  background: #f3f4f6;
}
</style>
