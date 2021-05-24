import { useState } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import { format } from 'date-fns';
import Prismic from '@prismicio/client';
import { BiCalendarAlt } from 'react-icons/bi';
import { IoPersonOutline } from 'react-icons/io5';

import ptBR from 'date-fns/locale/pt-BR';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(postsPagination);

  async function refetchPrismicData(): Promise<void> {
    const response = await fetch(`${posts.next_page}`).then(data =>
      data.json()
    );

    const postsFormated = response.results.map(post => ({
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }));

    const newPosts = {
      ...posts,
      next_page: response.next_page,
      results: [...posts.results, ...postsFormated],
    };

    setPosts(newPosts);
  }

  return (
    <div className={commonStyles.container}>
      <div className={styles.cardList}>
        {posts.results.map(post => (
          <Link href={`/post/${post.uid}`} key={post.uid}>
            <div className={styles.cardItem}>
              <strong>{post.data.title}</strong>
              <p>{post.data.subtitle}</p>
              <div className={styles.cardFooter}>
                <BiCalendarAlt size={19} color="#bbb" />
                <time>
                  {format(
                    new Date(post.first_publication_date),
                    'dd MMM yyyy',
                    {
                      locale: ptBR,
                    }
                  )}
                </time>
                <IoPersonOutline size={17} color="#bbb" />
                <span>{post.data.author}</span>
              </div>
            </div>
          </Link>
        ))}
        {posts.next_page && (
          <button
            type="button"
            className={styles.loadMore}
            onClick={refetchPrismicData}
          >
            Carregar mais posts
          </button>
        )}
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 5,
      page: 1,
    }
  );

  const postsFormated = postsResponse.results.map(post => ({
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  }));

  const postsPagination = { ...postsResponse, results: postsFormated };

  return {
    props: {
      postsPagination,
    },
  };
};
