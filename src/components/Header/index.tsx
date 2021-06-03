import Link from 'next/link'

import styles from './header.module.scss'

export default function Header() {

  return (
    <header>
      <Link href='/'>
      <a>
        <div className={styles.headerContent}>
          <img src="/logo.svg" alt="logo" />
        </div>
      </a>
      </Link>
    </header>
  )
}
