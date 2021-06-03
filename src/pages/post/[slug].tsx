import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router'
import Prismic from '@prismicio/client'
import PrismicDOM, { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header'

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

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

export default function Post({ post }: PostProps) {
  const router = useRouter()

  if (router.isFallback) {
    return <div>Carregando...</div>
  }

  const readingTime = post.data.content.reduce((acc, obj) => {
    const bodyText = RichText.asText(obj.body)
    const textLength = bodyText.split(/\s/g).length
    const time = Math.ceil(textLength/200)

    return acc + time
  }, 0)

  return (
    <>
      <Header />
      <main className={styles.container}>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={styles.tags}>
            <span>{format(
              new Date(post.first_publication_date),
              "dd MMM yyy",
              {
                locale: ptBR,
              }
            )}</span>
            <span>{post.data.author}</span>
            <span>{readingTime} min</span>
          </div>
          <img src={post.data.banner.url} alt="image" />
          <div className={styles.postContent}>
            {post.data.content.map(block => (
              <div key={block.heading}>
                <h3>{block.heading}</h3>
                <p>{block.body.map(paragraph => (paragraph.text))}</p>
              </div>
              ))}
          </div>
        </article>
      </main>
    </>
  )
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
  );

  return {
    paths: posts.results.map((doc) => {
      return { params: { slug: doc.uid }};
    }),
    fallback: true
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {});
  console.log('response.data.group', response.data.group)

  const content = await response.data.group?.map(item => ({
    heading: item.heading,
    body: item.body.map(p => ({
      text: p.text
    })),
  }))

  const post = {
    first_publication_date: response.first_publication_date,
    uid: response.uid,
    data: {
      ...response.data,
      ...content,
      banner: {
        url: response.data.banner.url
      },
    },
  }

  return {
    props: {
      post
    },
    revalidate: 60 * 60 * 24
  }
};
