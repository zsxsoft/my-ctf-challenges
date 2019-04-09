import PropTypes from 'prop-types'
import React, { Component } from 'react'
import App from 'universal/components/App/App'

class AppContainer extends Component {
  static propTypes = {
    children: PropTypes.oneOfType([
      PropTypes.element,
      PropTypes.array
    ])
  };

  render () {
    return (
      <App {...this.props}/>
    )
  }
}

export default AppContainer
