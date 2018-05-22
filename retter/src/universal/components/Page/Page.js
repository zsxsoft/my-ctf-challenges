import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withStyles } from 'material-ui/styles'
import { CircularProgress } from 'material-ui/Progress'
import Fade from 'material-ui/transitions/Fade'
import styles from './Page.scss'

const inlineStyles = theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap'
  }
})

class Page extends Component {
  static propTypes = {
    classes: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    title: PropTypes.string.isRequired,
    children: PropTypes.array,
    loading: PropTypes.bool.isRequired
  }

  render () {
    const { title, children, loading } = this.props
    return (
      <div style={{width: '100%'}}>
        <div className={styles.paper}>
          <div className={styles['post-content']} style={{opacity: loading ? '0.2' : '1'}}>
            <div>
              <h2>{title}</h2>
            </div>
            {children}
          </div>
          <div style={{
            display: loading ? 'flex' : 'none'
          }} className={styles.loading}>
            <Fade
              in
              style={{
                transitionDelay: '800ms'
              }}
              unmountOnExit
            >
              <CircularProgress size={100} />
            </Fade>
          </div>
        </div>
      </div>
    )
  }
}

export default withStyles(inlineStyles)(Page)
