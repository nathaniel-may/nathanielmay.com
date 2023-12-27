import PropTypes from 'prop-types'
import React from 'react'

const Header = props => (
  <header id="header" style={props.timeout ? { display: 'none' } : {}}>
    <div className="logo">
      <p style={{"font-weight": "500", "font-size": "30px"}}>λ</p>
    </div>
    <div className="content">
      <div className="inner">
        <h1>Nathaniel May</h1>
        <h2>Senior Software Engineer</h2>
        <p>
          Management Experience · Rust · Haskell · Data
        </p>
      </div>
    </div>
    <nav>
      <ul>
      <li>
      <ul className="branch">
        <li className="leaf">
          <a href="https://dev.to/codenoodle" title="blog" target="_blank">
            <div className="logo">
              <span className="icon fa-book"></span>
            </div>
          </a>
        </li>
        <li className="leaf">
          <a href="https://github.com/nathaniel-may" title="github" target="_blank">
            <div className="logo">
              <span className="icon fa-github"></span>
            </div>
          </a>
        </li>
      </ul>
      </li>
      <li>
      <ul className="branch">
        <li className="leaf">
          <a href="https://twitter.com/codenoodle" title="twitter" target="_blank">
            <div className="logo">
              <span className="icon fa-twitter"></span>
            </div>
          </a>
        </li>
        <li className="leaf">
          <a href="https://www.linkedin.com/in/nathanieldmay/" title="linkedin" target="_blank">
            <div className="logo">
              <span className="icon fa-linkedin"></span>
            </div>
          </a>
        </li>
      </ul>
      </li>
      </ul>
    </nav>
  </header>
)

Header.propTypes = {
  onOpenArticle: PropTypes.func,
  timeout: PropTypes.bool,
}

export default Header
