import { useState, useRef } from 'react';
import { AbortError, Aborter } from 'saborter';

const getUsers = async (signal) => {
  const response = await fetch('https://apimocker.com/users?_delay=3000', { signal });

  return response.json();
};

export const App = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const aborterRef = useRef(new Aborter());

  const handleLoad = async () => {
    try {
      setLoading(true);
      setUsers([]);

      const data = await aborterRef.current.try(getUsers);

      setUsers(data.data);
    } catch (error) {
      console.log(error instanceof AbortError);
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
