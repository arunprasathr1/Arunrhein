import React, { Component } from "react";
import PropTypes from "prop-types";

const propTypes = {
  children: PropTypes.node
};

const defaultProps = {};
class AppHeader extends Component {
  render() {
    return (
      <header className="App-header">
        <nav>
          <div className="navbar-brand">e2e Integration Suite</div>
        </nav>
      </header>
    );
  }
}

AppHeader.propTypes = propTypes;
AppHeader.defaultProps = defaultProps;

export default AppHeader;
