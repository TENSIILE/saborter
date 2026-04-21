import { useState } from 'react';
import { Aborter } from 'saborter';

interface User {
  id: number;
  name: string;
}

interface Post {
  id: number;
  title: string;
}

const getUsers = async () => {
  const response = await fetch('https://jsonplaceholder.typicode.com/users');

  return (await response.json()) as User[];
};

const getPosts = async () => {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts');

  return (await response.json()) as Post[];
};

const useAborter = <D,>() => {
  const [data, setData] = useState<D | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [aborter] = useState(
    () =>
      new Aborter({
        onInit: (aborter) => {
          aborter.listeners.addEventListener('fulfilled', (d) => {
            setData(d);
          });

          aborter.listeners.addEventListener('rejected', (er) => {
            setError(er);
          });

          aborter.listeners.state.subscribe((s: any) => {
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
  const { aborter: usersAborter, data: users, error, loading } = useAborter<User[]>();
  const { aborter: postsAborter, data: posts, loading: postsLoading } = useAborter<Post[]>();

  const handlePostsLoad = async () => {
    postsAborter.try(getPosts, { timeout: 1000 });
  };

  const handleUsersLoad = async () => {
    usersAborter.try(getUsers);
    handlePostsLoad();
  };

  const handleCancel = () => {
    // postsAborter.abort();
    usersAborter.abort();
  };

  return (
    <>
      <h1>Saborter Check</h1>
      <div className='card'>
        <div className='gap-2'>
          <button onClick={handleUsersLoad}>Load</button>
          <button onClick={handleCancel}>Cancel</button>
        </div>

        {(loading || postsLoading) && <p>Loading...</p>}
        {error && <p>{String(error)}</p>}
        <ul>
          {users?.map((user) => {
            return <li key={user.id}>{user.name}</li>;
          })}
        </ul>
        <hr />
        <ul>
          {posts?.map((post) => {
            return <li key={post.id}>{post.title}</li>;
          })}
        </ul>
      </div>
    </>
  );
};
