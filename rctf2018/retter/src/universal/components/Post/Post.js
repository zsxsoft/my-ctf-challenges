import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from 'material-ui/Button'
import { withStyles } from 'material-ui/styles'
import TextField from 'material-ui/TextField'
import styles from './Post.scss'
import axios from 'axios'
import Page from '../Page/Page'

const inlineStyles = theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap'
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    width: '100%'
  },
  menu: {
    width: 200
  }
})

class Post extends Component {
  static propTypes = {
    classes: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
  }

  constructor () {
    super()
    this.state = {
      loading: false,
      to: 'Major Gilbert',
      content: 'Do you have any news? Are you doing well? Where are you right now? Are you having any difficulties? Spring, summer, autumn, and winter…Many seasons have come and gone, but the one with you isn’t coming around at all.\nAt first, I couldn’t understand. I couldn’t understand anything about how you felt. But within this new life you gave me, I’ve begun to feel the same way as you, if only a little, through ghostwriting and through the people I’ve met along the way. I believe that you are still alive somewhere. So I shall live, live, live and live some more, though there’s no telling what life might have in store.\nAnd if I can ever see you again, I want to let you know…that the phrase “I love you”',
      from: 'Violet Evergarden'
    }
  }

  handleChange = name => event => {
    this.setState({
      [name]: event.target.value
    })
  }

  send = () => {
    this.setState({loading: true})
    axios.post('/', this.state).then(p => {
      this.setState({loading: false}, () => {
        this.props.history.push('/article/' + p.data)
      })
    })
  }

  render () {
    const { classes } = this.props
    return (
      <Page
        loading={this.state.loading}
        title='Letter'
      >
        <div className={styles['form-item']}>
          <TextField
            label="To"
            onChange={this.handleChange('to')}
            className={classes.textField}
            value={this.state.to} />
        </div>
        <div className={styles['form-item']}>
          <TextField
            label="Content"
            onChange={this.handleChange('content')}
            className={classes.textField}
            value={this.state.content}
            multiline
            rowsMax="30" />
        </div>
        <div>
          <Button variant="raised" color="primary" onClick={this.send}>Save Draft</Button>
        </div>
      </Page>
    )
  }
}

export default withStyles(inlineStyles)(Post)
