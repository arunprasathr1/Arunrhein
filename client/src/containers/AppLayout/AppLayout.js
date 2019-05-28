import React, { Component } from "react";
import AppHeader from "./AppHeader";
import AppBody from "./AppBody";

class AppLayout extends Component {
  render() {
    return (
      <div className="App">
        <AppHeader />
        <AppBody />
      </div>
    );
  }
}

export default AppLayout;
