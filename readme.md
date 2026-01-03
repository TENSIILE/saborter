## Saborter

Простая и эффективная библиотека для отмены асинхронных запросов с использованием AbortController.

## 📦 Установка

```bash
npm install saborter
# или
yarn add saborter
```

## 🚀 Быстрый старт

### Базовое использование

```javascript
import { Aborter } from 'saborter';

// Создаем экземпляр Aborter
const aborter = new Aborter();

// Используем для запроса
async function fetchData() {
  try {
    const result = await aborter.try(signal => fetch('/api/data', { signal }), { isErrorNativeBehavior: true });
    console.log('Данные получены:', result);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Запрос был отменен');
    } else {
      console.error('Ошибка запроса:', error);
    }
  }
}
```

## 📖 Основные возможности

### 1. Отмена запросов

Класс `Aborter` позволяет легко отменять выполняющиеся запросы:

```javascript
const aborter = new Aborter();

// Запускаем долгий запрос
const longRequest = aborter.try(signal => fetch('/api/long-task', { signal }));

// Отменяем запрос через 2 секунды
setTimeout(() => {
  aborter.abort();
  console.log('Запрос отменен');
}, 2000);
```

### 2. Автоматическая отмена предыдущих запросов

При каждом новом вызове **try** предыдущий запрос автоматически отменяется:

```javascript
// При поиске с автодополнением
async function handleSearch(query) {
  // Предыдущий запрос отменяется автоматически
  const results = await aborter.try(signal => fetch(`/api/search?q=${query}`, { signal }));
  return results;
}

// При быстром вводе пользователя:
handleSearch('a'); // Запускается
handleSearch('ab'); // Первый запрос отменяется, запускается новый
handleSearch('abc'); // Второй запрос отменяется, запускается новый
```

### 3. Работа с несколькими запросами

Вы можете создавать отдельные экземпляры для разных групп запросов:

```javascript
// Разделяем запросы по типам
const userAborter = new Aborter();
const dataAborter = new Aborter();

// Отдельно управляем пользовательскими запросами
async function fetchUser(id) {
  return userAborter.try(signal => fetch(`/api/users/${id}`, { signal }));
}

// И отдельно - данными
async function fetchData(params) {
  return dataAborter.try(signal => fetch('/api/data', { signal, ...params }));
}

// Отменяем только пользовательские запросы
function cancelUserRequests() {
  userAborter.abort();
}
```

## 🔧 API

### Конструктор

```javascript
new Aborter();
```

Создает новый экземпляр `Aborter`. Не принимает параметров.

### Свойства

`signal`

Возвращает `AbortSignal`, связанный с текущим контроллером.

```javascript
const aborter = new Aborter();

// Используем signal в запросе
fetch('/api/data', {
  signal: aborter.signal,
});
```

### Методы

`try(request, options?)`

Выполняет асинхронный запрос с возможностью отмены.

**Параметры:**

- `request: (signal: AbortSignal) => Promise<T>` - функция, выполняющая запрос
- `options?: Object` (опционально)
  - `isErrorNativeBehavior: boolean` - флаг для управления обработкой ошибок

**Возвращает:** `Promise<T>`

**Примеры:**

```javascript
// Простой запрос
const result = await aborter.try(signal => {
  return fetch('/api/data', { signal }).then(response => response.json());
});

// С кастомной логикой запроса
const result = await aborter.try(async signal => {
  const response = await fetch('/api/data', { signal });
  if (!response.ok) {
    throw new Error('Ошибка сервера');
  }
  return response.json();
});
```

`abort(reason?)`

**Параметры:**

- `reason?: any` - причина прерывания запроса (опционально)

Немедленно отменяет текущий выполняющийся запрос.

```javascript
// Запускаем запрос
const requestPromise = aborter.try(signal => fetch('/api/data', { signal }));

// Отменяем
aborter.abort();

// Обрабатываем отмену
requestPromise.catch(error => {
  if (error.name === 'AbortError') {
    console.log('Запрос отменен');
  }
});
```

`static isError(error)`

Статический метод для проверки, является ли объект ошибкой `AbortError`.

```javascript
try {
  await aborter.try(signal => fetch('/api/data', { signal }));
} catch (error) {
  if (Aborter.isError(error)) {
    console.log('Это ошибка отмены');
  } else {
    console.log('Другая ошибка:', error);
  }
}
```

## 🎯 Примеры использования

### Пример 1: Автокомплит

```javascript
class SearchAutocomplete {
  aborter = new Aborter();

  async search(query) {
    if (!query.trim()) return [];

    try {
      const results = await this.aborter.try(async signal => {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal });
        return response.json();
      });

      this.displayResults(results);
    } catch (error) {
      // Получаем любую ошибку, кроме AbortError
      console.error('Ошибка поиска:', error);
    }
  }

  displayResults(results) {
    // Отображаем результаты
  }
}
```

### Пример 2: Загрузка файла с отменой

```javascript
class FileUploader {
  constructor() {
    this.aborter = new Aborter();
    this.progress = 0;
  }

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      await this.aborter.try(
        async signal => {
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
            signal,
          });

          // Отслеживаем прогресс
          const reader = response.body.getReader();
          let receivedLength = 0;
          const contentLength = +response.headers.get('Content-Length');

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            receivedLength += value.length;
            this.progress = Math.round((receivedLength / contentLength) * 100);
          }
        },
        { isErrorNativeBehavior: true },
      );

      console.log('Файл успешно загружен');
    } catch (error) {
      if (Aborter.isError(error)) {
        console.log('Загрузка отменена');
      } else {
        console.error('Ошибка загрузки:', error);
      }
    }
  }

  cancelUpload() {
    this.aborter.abort();
  }
}
```

### Пример 3: Интеграция с UI фреймворками

**React**

```javascript
import React, { useState, useEffect, useRef } from 'react';
import { Aborter } from 'saborter';

function DataFetcher({ url }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const aborterRef = useRef(new Aborter());

  useEffect(() => {
    return () => {
      aborterRef.current.abort();
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await aborterRef.current.try(async signal => {
        const response = await fetch(url, { signal });
        return response.json();
      });
      setData(result);
    } catch (error) {
      // Обработка fetch ошибки
    } finally {
      setLoading(false);
    }
  };

  const cancelRequest = () => {
    if (aborterRef.current) {
      aborterRef.current.abort();
    }
  };

  return (
    <div>
      <button onClick={fetchData} disabled={loading}>
        {loading ? 'Загрузка...' : 'Загрузить данные'}
      </button>
      <button onClick={cancelRequest} disabled={!loading}>
        Отменить
      </button>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
```

**Vue.js**

```javascript
import { Aborter } from 'saborter';

export default {
  data() {
    return {
      aborter: null,
      data: null,
      loading: false,
    };
  },
  created() {
    this.aborter = new Aborter();
  },
  beforeDestroy() {
    this.aborter.abort();
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        this.data = await this.aborter.try(async signal => {
          const response = await fetch(this.url, { signal });
          return response.json();
        });
      } catch (error) {
        // Обработка fetch ошибки
      } finally {
        this.loading = false;
      }
    },
    cancelRequest() {
      this.aborter.abort();
    },
  },
};
```

## ⚠️ Важные особенности

### Поведение при ошибках

По умолчанию метод `try()` не отклоняет промис при `AbortError` (ошибке отмены). Это позволяет предотвратить вызов `catch` блока при отмене запроса.

Если вам нужно стандартное поведение (чтобы промис отклонялся при любой ошибке), используйте опцию `isErrorNativeBehavior`:

```javascript
// Промис будет отклонен даже при AbortError
const result = await aborter
  .try(signal => fetch('/api/data', { signal }), { isErrorNativeBehavior: true })
  .catch(error => {
    // Сюда попадут ВСЕ ошибки, включая отмену
    if (error.name === 'AbortError') {
      console.log('Отменено');
    }
  });
```

### Очистка ресурсов

Всегда отменяйте запросы при размонтировании компонентов или закрытии страниц:

```javascript
// В React
useEffect(() => {
  const aborter = new Aborter();

  // Выполняем запросы

  return () => {
    aborter.abort(); // Очистка при размонтировании
  };
}, []);
```

## 💻 Совместимость

- **Браузеры:** Все современные браузеры, поддерживающие AbortController
- **Node.js:** Требует полифила для AbortController (версия 16+ имеет встроенную поддержку)
- **TypeScript:** Полная поддержка типов
