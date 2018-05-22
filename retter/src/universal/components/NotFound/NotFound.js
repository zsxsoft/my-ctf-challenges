import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withStyles } from 'material-ui/styles'
import TextField from 'material-ui/TextField'
import Button from 'material-ui/Button'
import Page from '../Page/Page'
import { Flag } from '../../routes/async'
import axios from 'axios'

const inlineStyles = theme => ({})

class NotFound extends Component {
  static propTypes = {
    classes: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
  }

  state = {
    loading: false,
    captcha: 'Getting captcha...',
    input: ''
  }

  updateCaptcha = () => {
    axios.get('/captcha', {withCredentials: true}).then(p => {
      this.setState({captcha: p.data})
    })
  }

  handleChange = name => event => {
    this.setState({
      [name]: event.target.value
    })
  }

  componentWillReceiveProps () {
    this.updateCaptcha()
  }

  componentDidMount () {
    this.updateCaptcha()
  }

  postToServer = (response) => {
    this.setState({
      loading: true
    }, () => {
      axios.post('/contact', {
        'captcha': this.state.input,
        url: this.props.location.pathname
      }, {
        withCredentials: true
      }).then(p => {
        alert(p.data)
        this.setState({loading: false, input: ''}, () => {
          this.updateCaptcha()
        })
      })
    })
  }

  render () {
    return (
      <Page
        loading={this.state.loading}
        title='Not Found'
      >
        <div>
          <p>404 Not Found!</p>
          <p>Please contact admin for help!</p>
        </div>
        <div style={{display: 'none'}}>
          <p>Congrats, you found this hint!</p>
        </div>

        {__CLIENT__/* eslint-disable-line no-undef */ && window && window.location.hostname === 'admin.retter.2018.teamrois.cn' ? <Flag /> : <div style={{textAlign: 'center'}}>
          <p>Report this page to administrator</p>
          <p>{this.state.captcha}</p>
          <p><TextField
            label="Captcha"
            onChange={this.handleChange('input')}
            value={this.state.input} /></p>
          <Button variant="raised" color="primary" onClick={this.postToServer}>Report</Button>
        </div>}
      </Page>
    )
  }
}

export default withStyles(inlineStyles)(NotFound)
