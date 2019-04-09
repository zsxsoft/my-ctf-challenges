import React from 'react'

function asyncRoute (getComponent) {
  return class AsyncComponent extends React.Component {
    state = {
      Component: null
    };

    componentDidMount () {
      if (this.state.Component === null) {
        getComponent().then((Component) => {
          this.setState({Component: Component.default})
        })
      }
    }

    render () {
      const {
        Component
      } = this.state

      if (Component) {
        return (<Component {...this.props} />)
      }
      return (<div>Loading...</div>) // or <div /> with a loading spinner, etc..
    }
  }
}

export const Post = asyncRoute(() => import('../components/Post/Post.js'))
export const Article = asyncRoute(() => import('../components/Article/Article.js'))
export const NotFound = asyncRoute(() => import('../components/NotFound/NotFound.js'))

export const Flag = asyncRoute(() => import(/* webpackChunkName: "flag" */'../components/Flag.js'))
