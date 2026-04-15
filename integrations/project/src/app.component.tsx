import { useState } from 'react';
import { Aborter } from 'saborter';

interface User {
  id: number;
  name: string;
}

const getUsers = async (signal: AbortSignal) => {
  const response = await fetch('https://jsonplaceholder.typicode.com/users', { signal });

  return (await response.json()) as { data: User[] };
};

const useAborter = <D,>() => {
  const [data, setData] = useState<D | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [aborter] = useState(
    () =>
      new Aborter({
        onInit: (aborter) => {
          console.log('state:', aborter.listeners.state.value);

          aborter.listeners.addEventListener('fulfilled', (d) => {
            setData(d);
          });

          aborter.listeners.addEventListener('rejected', (er) => {
            setError(er);
          });

          aborter.listeners.state.subscribe((s) => {
            setLoading(s === 'pending');
            setError(null);
            setData(null);
          });
        }
      })
  );

  return { aborter, data, loading, error };
};

export const App = () => {
  const { aborter, data, error, loading } = useAborter<User[]>();

  const handleLoad = async () => {
    aborter.try(getUsers);
  };

  const handleCancel = () => aborter.abort();

  return (
    <>
      <h1>Saborter Check</h1>
      <div className='card'>
        <div className='gap-2'>
          <button onClick={handleLoad}>Load</button>
          <button onClick={handleCancel}>Cancel</button>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p>{String(error)}</p>}
        <ul>
          {data?.map((user) => {
            return <li key={user.id}>{user.name}</li>;
          })}
        </ul>
      </div>
    </>
  );
};
