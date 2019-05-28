import React, { Component } from "react";
import TableView from "./TableView";
import GraphView from "./GraphView";

class AppBody extends Component {
  state = {
    scenario: "None",
    isClicked: false
  };
  setScenario = keyVal => {
    this.setState({ scenario: keyVal, isClicked: true });
    //console.log("keyVal=", keyVal);
  };
  render() {
    const isClicked = this.state.isClicked;
    let graphView;
    if (isClicked) {
      graphView = <GraphView scenario={this.state.scenario} />;
    }
    return (
      <div className="page-view monitoring-view monitoring-view-center">
        <div className="layout-row monitoring-home">
          <div className="flex-100">
            <section className="monitoring-home-content">
              <TableView onClickSetState={this.setScenario} />
              {graphView}
            </section>
          </div>
        </div>
      </div>
    );
  }
}

export default AppBody;
