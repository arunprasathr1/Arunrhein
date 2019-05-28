import React, { Component } from "react";
import { HashRouter, Route, Switch } from "react-router-dom";
import "./scss/style.css";
import "./App.css";
import { AppLayout } from "./containers";
class App extends Component {
  render() {
    return (
      <HashRouter>
        <Switch>
          <Route path="/" name="Home" component={AppLayout} />
        </Switch>
      </HashRouter>
    );
  }
}

export default App;
