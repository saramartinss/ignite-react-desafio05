import { GetStaticProps } from 'next';
import Head from 'next/head'
import Link from 'next/link'
import Prismic from '@prismicio/client'

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';

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

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState(postsPagination)

  async function handleLoadMore() {
    try {
      const response = await fetch(postsPagination.next_page)
      const { results, next_page } = await response.json()

      const data = results.map((post: Post) => ({
          uid: post.uid,
          first_publication_date: post.first_publication_date,
          data: {
            title: post.data.title,
            subtitle: post.data.subtitle,
            author: post.data.author,
          },
      }))

      setPosts(state => {
        return {
          results: [...state.results, ...data],
          next_page: next_page
        }
      })
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <main className={styles.container}>
      <div className={styles.posts}>
      <img src="/logo.svg" alt="logo" />
      {posts.results.map(post => (
        <Link key={post.uid} href={`/post/${post.uid}`}>
        <a>
          <strong>{post.data.title}</strong>
          <p>{post.data.subtitle}</p>
          <div>
            <span>{format(
              new Date(post.first_publication_date),
              "dd MMM yyy",
              {
                locale: ptBR,
              }
            )}</span>
            <span>{post.data.author}</span>
          </div>
        </a>
      </Link>
      ))}
      {posts.next_page !== null &&
        <button type="button" className={styles.readMoreButton} onClick={handleLoadMore}>
          Carregar mais posts
        </button>}
      </div>
    </main>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 1,
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: postsResponse.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      }
    })
  }

  return {
    props: {
      postsPagination
    }
  }
};
