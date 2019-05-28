import React, { Component } from "react";

class Tabs extends Component {
  handleOnClick(key, event) {
    event.preventDefault();
    this.props.toHandleTabChange(key);
  }

  renderTabItem(key) {
    let tab = this.props.children[key];
    const idx = parseInt(key, 10);
    return (
      <span
        key={key}
        className={
          this.props.activeIdx === idx
            ? "au-target tab_item active"
            : "au-target tab_item"
        }
        onClick={this.handleOnClick.bind(this, idx)}
      >
        {tab.props.title}
      </span>
    );
  }

  render() {
    return (
      <div className="table-contents__tabs monitor-tabs">
        {Object.keys(this.props.children).map(this.renderTabItem.bind(this))}
      </div>
    );
  }
}

class Tab extends Component {
  render() {
    return (
      <div className={this.props.active ? " active" : ""}>
        {this.props.children}
      </div>
    );
  }
}

Tab.defaultProps = {
  active: false
};

export { Tabs, Tab };
