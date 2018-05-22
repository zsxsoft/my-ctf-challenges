import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from 'material-ui/Button'
import { withStyles } from 'material-ui/styles'
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
    history: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired
  }

  constructor () {
    super()
    this.state = {
      loading: true,
      to: '',
      content: '',
      sent: false
    }
  }

  componentDidMount () {
    axios.get(`/${this.props.match.params.id}`).then(p => p.data).then(p => {
      this.setState({
        to: p.to,
        content: p.content,
        loading: false
      })
    })
  }

  send = () => {
    this.setState({loading: true})
    setTimeout(() => {
      this.setState({
        loading: false,
        sent: true
      })
    }, 3000)
  }

  render () {
    return (
      <Page
        loading={this.state.loading}
        title='Letter'
      >
        <div style={{padding: '1em'}}>
          <p>To: {this.state.to}</p>
          <p />
          {this.state.content.split('\n').map((c, i) => <p key={i}>{c}</p>)}
          <p />
          {this.state.sent
            ? <p style={{width: '100%', textAlign: 'center'}} >Letter sent!</p>
            : <Button variant="raised" color="primary" style={{width: '100%'}} onClick={this.send}>Let {this.state.to} Know</Button>
          }
        </div>
      </Page>
    )
  }
}

export default withStyles(inlineStyles)(Post)
