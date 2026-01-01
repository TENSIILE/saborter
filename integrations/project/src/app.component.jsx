import { useState, useRef } from 'react';
import { Aborter } from 'saborter';

const getUsers = async signal => {
  const response = await fetch('https://apimocker.com/users?_delay=3000', { signal });

  return response.json();
};

export const App = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const aborterRef = useRef(new Aborter());

  const handleLoad = async () => {
    setLoading(true);
    setUsers([]);

    const data = await aborterRef.current.try(getUsers);

    setLoading(false);
    setUsers(data.data);
  };

  const handleCancel = () => {
    aborterRef.current.abort();
    setLoading(false);
    setUsers([]);
  };

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
          {users?.map(user => {
            return <li key={user.id}>{user.name}</li>;
          })}
        </ul>
      </div>
    </>
  );
};
