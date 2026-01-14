import { useState, useRef, useEffect } from 'react';
import { Aborter, AbortError, AbortByTimeoutError } from 'saborter';

const getUsers = async (signal) => {
  const response = await fetch('https://apimocker.com/users?_delay=3000', { signal });

  return response.json();
};

const getPosts = async (signal) => {
  const response = await fetch('https://apimocker.com/posts?_delay=3000', { signal });

  return response.json();
};

export const App = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const aborterRef = useRef(
    new Aborter({
      onAbort: (e) => {
        if (e.type === 'aborted') return console.log('onAbort', e);

        setLoading(true);
        setUsers([]);
      }
    })
  );

  useEffect(() => {
    return aborterRef.current.listeners.addEventListener('aborted', (e) => {
      console.log('aborted', e);
      setLoading(false);
      setUsers([]);
    });
  }, []);

  const handleLoad = async () => {
    try {
      const users = await aborterRef.current.try(getUsers);
      const posts = await aborterRef.current.try(getPosts);

      setLoading(false);
      setUsers(users.data);
    } catch (error) {
      console.log('error', error);
    }
  };

  // const handleCancel = () =>
  //   aborterRef.current.abort({ reason: new AbortError('non message', { reason: { userId: 1 } }) });

  const handleCancel = () =>
    aborterRef.current.abort({
      // reason: new AbortError('non message', { reason: { userId: 1 } }),
      abortByName: 'getPosts'
    });

  return (
    <>
      <h1>Проверка Saborter</h1>
      <div className='card'>
        <div className='gap-2'>
          <button onClick={handleLoad}>Загрузить</button>
          <button onClick={handleCancel}>Отменить</button>
        </div>

        {loading && <p>Loading...</p>}
        <ul>
          {users?.map((user) => {
            return <li key={user.id}>{user.name}</li>;
          })}
        </ul>
      </div>
    </>
  );
};
