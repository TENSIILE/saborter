import { useState, useRef } from 'react';
import { Aborter } from 'saborter';

interface User {
  id: number;
  name: string;
}

const getUsers = async (signal: AbortSignal) => {
  return fetch('https://apimocker.com/users?_delay=3000', { signal });
};

export const App = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const aborterRef = useRef(new Aborter());

  const handleLoad = async () => {
    try {
      setLoading(true);
      setUsers([]);

      const data = await aborterRef.current.try<{ data: User[] }>(getUsers);

      setUsers(data.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => aborterRef.current.abort();

  return (
    <>
      <h1>Saborter Check</h1>
      <div className='card'>
        <div className='gap-2'>
          <button onClick={handleLoad}>Load</button>
          <button onClick={handleCancel}>Cancel</button>
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
