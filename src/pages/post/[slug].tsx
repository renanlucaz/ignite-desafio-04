import { GetStaticPaths, GetStaticProps } from 'next';
import { format } from 'date-fns';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import ptBR from 'date-fns/locale/pt-BR';

import { useRouter } from 'next/router';
import { BiCalendar } from 'react-icons/bi';
import { AiOutlineClockCircle } from 'react-icons/ai';
import { IoPerson } from 'react-icons/io5';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <div className={commonStyles.container}>
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt="logo" />
      </div>
      <main className={styles.main}>
        <h1>{post.data.title}</h1>

        <div className={styles.postInfo}>
          <div>
            <BiCalendar color="#bbb" />
            <time>
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </time>
          </div>

          <div>
            <IoPerson color="#bbb" />
            <span>{post.data.author}</span>
          </div>

          <div>
            <AiOutlineClockCircle color="#bbb" />
            <span>4 min</span>
          </div>
        </div>

        <div className={styles.content}>
          {post.data.content.map(content => (
            <div key={content.heading}>
              <h2>{content.heading}</h2>
              <section
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['post.title'],
      pageSize: 20,
      page: 1,
    }
  );

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const post = await prismic.getByUID('posts', String(slug), {});

  return {
    props: {
      post,
    },
    revalidate: 60 * 30, // 30 minutos
  };
};
