import PropTypes from 'prop-types'
import React, { Component } from 'react'
import CssBaseline from 'material-ui/CssBaseline'
import styles from './App.css'
import ThemeProvider from 'material-ui/styles/MuiThemeProvider'
import { createMuiTheme } from 'material-ui/styles'
import axios from 'axios'

axios.defaults.baseURL = 'http://localhost:9999/'

const theme = createMuiTheme({
  palette: {
    primary: {
      light: '#ffff8b',
      main: '#ffee58',
      dark: '#c9bc1f',
      contrastText: '#000'
    },
    secondary: {
      light: '#ffffcf',
      main: '#fff59d',
      dark: '#cbc26d',
      contrastText: '#000'
    }
  }
})

class App extends Component {
  static propTypes = {
    children: PropTypes.element.isRequired
  }

  render () {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline>
          <div className={styles.app}>
            {this.props.children}
          </div>
        </CssBaseline>
      </ThemeProvider>
    )
  }
}

export default App
