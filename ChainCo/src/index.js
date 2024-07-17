import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route } from 'react-router-dom'

import './style.css'
import Home from './views/home'
import Autocrate from './views/Autocrate'
import Verify from './views/Verify'
import Portfolio from './views/Portfolio'
import { AppProvider } from './AppContext'
import Multiple from './views/Multiple'
import ReputationSystem from './views/ReputationSystem'
import JobsAvailable from './views/JobsAvailable'
import Swap from './views/Swap'

const App = () => {
  return (
    <Router>
      <AppProvider>
      <div>
        <Route component={Home} exact path="/" />
        <Route component={Autocrate} exact path="/autocrate" />
        <Route component={Verify} exact path="/verify" />
        <Route component={Portfolio} exact path="/portfolio" />
        <Route component={Multiple} exact path="/multiple" />
        <Route component={ReputationSystem} exact path="/reputation" />
        <Route component={JobsAvailable} exact path="/jobsavailable" />
        <Route component={Swap} exact path="/swap" />
      </div>
      </AppProvider>
    </Router>
  )
}

ReactDOM.render(<App />, document.getElementById('app'))
