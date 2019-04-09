// Libraries
import PropTypes from 'prop-types'

import React, { Component } from 'react'
import {Route, Switch} from 'react-router'

// Routes
// For Development only
import * as RouteMap from '../routes/static.js'

// This is used in production for code splitting via `wepback.config.server.js`
// import * as RouteMap from 'universal/routes/async.js';

// Containers
import AppContainer from 'universal/containers/App/AppContainer.js'
// import PrivateRouteContainer from 'universal/containers/PrivateRoute/PrivateRouteContainer.js';

class Routes extends Component {
  static propTypes = {
    location: PropTypes.object.isRequired
  }

  render () {
    const {
      location
    } = this.props

    return (
      <AppContainer>
        <Switch>
          <Route exact location={location} path='/' component={RouteMap.Post} />
          <Route exact location={location} path='/article/:id' component={RouteMap.Article} />
          <Route component={RouteMap.NotFound} />
        </Switch>
      </AppContainer>
    )
  }
}

export default Routes
