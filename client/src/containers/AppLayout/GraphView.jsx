import React, { Component } from "react";
import GraphFlow from "../../components/GraphFlow";
import { Tabs, Tab } from "../../components/TabsView";
import OverviewTab from "../../components/Tabs/OverviewTab";
import HistoryTab from "../../components/Tabs/HistoryTab";

class GraphView extends Component {
  state = {
    value: 0,
    scenario: {},
    statusChange: true,
    log: "",
    intervalId: 0,
    info: false,
    infoVal: 0,
    infoTab: ["", ""],
    infoBody: []
  };

  componentDidMount() {
    fetch(`/api/getScenario/${this.props.scenario.id}`)
      .then(res => res.json())
      .then(
        scenario => {
          this.setState({ scenario });
          var intervalId = setInterval(this.checkJobStatus, 2000);
          // store intervalId in the state so it can be accessed later:
          this.setState({ intervalId: intervalId });
          //console.log("Scenario fetched...", scenario);
          this.getLog();
          this.getInfoTab();
          this.handleInfoTabChange(0);
          
        }
        //)
      );
    this.renderSAPIcons();
    //console.log("Mounted", this.state.scenario);
  }

  renderSAPIcons = () => {
    //let actIcon = new window.sap.ui.core.Icon({
    //  src: window.sap.ui.core.IconPool.getIconURI("activate")
    //});

    let playIcon = new window.sap.ui.core.Icon({
      src: window.sap.ui.core.IconPool.getIconURI("media-play")
    });

    let downloadIcon = new window.sap.ui.core.Icon({
      src: window.sap.ui.core.IconPool.getIconURI("download")
    });

    let hintIcon = new window.sap.ui.core.Icon({
      src: window.sap.ui.core.IconPool.getIconURI("hint")
    });

    playIcon.placeAt("playBtn");
    downloadIcon.placeAt("downloadBtn");
    hintIcon.placeAt("infoBtn");
  };

  componentDidUpdate(prevProps) {
    const status = this.state.scenario.stats.current.status;
    if (prevProps.scenario.id !== this.props.scenario.id) {
      //console.log("Updated", this.state);
      fetch(`/api/getScenario/${this.props.scenario.id}`)
        .then(res => res.json())
        .then(scenario => {
          this.setState({ scenario, value: 0, info: false });
          //console.log("scenario", scenario.info);
          this.getInfoTab();
          this.handleInfoTabChange(0);
          this.getLog();
        });
    }
    if (status === "Running" && this.state.statusChange !== false) {
      //console.log("In here");
      this.setState({ statusChange: false });
    } else if (status !== "Running" && this.state.statusChange === false) {
      //console.log("In here");
      this.setState({ statusChange: true });
    }
    return true;
  }

  componentWillUnmount() {
    // use intervalId from the state to clear the interval
    clearInterval(this.state.intervalId);
    //console.log("Unmounting");
  }

  setInfoState = () => {
    this.setState({ info: !this.state.info });
  };

checkJobStatus = () => {
console.log("Checking");
console.log("status", this.state.scenario.stats.current.status);
const status = this.state.scenario.stats.current.status;
if (status === "Running") {
fetch(`/api/getStatus/${this.props.scenario.id}`)
.then(res => res.json())
.then(scenario => {
this.setState({ scenario });
});
console.log("Running");
this.getLog();
}
}; 
 

//  checkJobStatus = () => {
//    //console.log("Checking");
//    const status = this.state.scenario.stats.current.status;
//    if (status === "Running") {
//      fetch(`/api/getStatus/${this.props.scenario.id}`)
//        .then(res => res.json())
//        .then(scenario => {
//          this.setState({ scenario });
//        });
//      console.log("Running");
//      this.getLog();
//    }
//  };

  activateJob = () => {
    this.setState({ activate: false });
    fetch(`/api/status/${this.props.scenario.id}`)
      .then(res => res.json())
      .then(scenario => {
        this.setState({ scenario });
        const status = this.state.scenario.stats.current.status;
        //console.log("status:", status);
        if (status === "Connection Established") {
          this.setState({ statusChange: true });
          //console.log(this.state.statusChange);
        }
      });
  };

  downloadReport = () => {
    window.open(
      `http://${window.location.hostname}:5000/api/getReport/${
        this.props.scenario.id
      }`
    );
  };

  execJob = () => {
    this.setState({});
    fetch(`/api/exec/${this.props.scenario.id}`)
      .then(res => res.json())
      .then(scenario =>
        this.setState({ scenario, statusDone: true, statusChange: false })
      );
  };

  getInfoTab = () => {
    this.setState({
      infoTab: Object.keys(this.state.scenario.info)
    });
  };

  getLog = () => {
    fetch(`/api/getLog/${this.props.scenario.id}`)
      .then(res => res.json())
      .then(log => {
        let newText = log["log"].split("\n").map(i => {
          return <p key={Math.random()}>{i}</p>;
        });

        this.setState({ log: newText });
      });
  };

  handleTabChange = value => {
    this.setState({ value });
  };

  handleInfoTabChange = infoVal => {
    const infoBody = this.state.scenario.info[
      Object.keys(this.state.scenario.info)[infoVal]
    ].item;

    this.setState({
      infoVal,
      infoBody
    });
  };
  render() {
    const infoTabElements = this.state.infoTab.map(x => {
      return <Tab title={x} key={this.state.infoVal} />;
    });

    const infoBodyElements = this.state.infoBody.map(x => {
      return (
        <div className="info-body-value" key={x["NAME"]}>
          <span>{x["NAME"] + ": "}</span>
          <span className="info-body-keyvalue"> {x["VERSION"]}</span>
        </div>
      );
    });

    /**/
    return (
      <div
        className="pull-right monitoringDetailPanel"
        onClick={() => {
          if (this.state.info) this.setState({ info: false });
        }}
      >
        <div className="monitoring-home-header layout-row">
          <div className="monitoring-home-header-title">
            <span className="monitoring-home-header-text wrapText shrinkText">
              {this.props.scenario.Name}
            </span>
          </div>
        </div>
        <div className="au-target pull-left monitoringGraphPanel">
          <div className="panelHeader" />
          <div className="panelBody">
            <div
              className="ActionBtn tooltip"
              style={{
                right: "120px"
              }}
            >
              <button
                className="sapiconfont"
                id="playBtn"
                disabled={!this.state.statusChange}
                onClick={this.execJob}
                style={{
                  color: this.state.statusChange
                    ? "#3b5e7c"
                    : "rgb(179, 178, 178)"
                }}
              />
              <span className="tooltiptext">Execute</span>
            </div>
            <div className="ActionBtn tooltip" style={{ right: "160px" }}>
              <button
                className="sapiconfont"
                id="downloadBtn"
                disabled
                style={{
                  color: "rgb(179, 178, 178)"
                }}
              />
              <span className="tooltiptext">Report</span>
            </div>
            <div className="ActionBtn" style={{ right: "95px" }}>
              <div className="infotip">
                <button
                  className="sapiconfont"
                  id="infoBtn"
                  onClick={this.setInfoState}
                />
                <span className="infotooltip">info</span>
              </div>
              <div
                className="infotiptext"
                style={{
                  visibility: this.state.info ? "visible" : "hidden",
                  opacity: 1,
                  transitionDelay: "0s"
                }}
              >
                <div className="info-header">System Details</div>
                <Tabs
                  toHandleTabChange={this.handleInfoTabChange}
                  activeIdx={this.state.infoVal}
                >
                  {infoTabElements}
                </Tabs>
                <div className="info-body">
                  <div className="info-body-header">Versions</div>
                  {infoBodyElements}
                </div>
              </div>
            </div>
            <div className="monitor-galilei-editor">
              <GraphFlow url={this.state.scenario} />
            </div>

            <Tabs
              toHandleTabChange={this.handleTabChange}
              activeIdx={this.state.value}
            >
              <Tab active="true" title="Overview" />
              <Tab title="Logs" />
              <Tab title="History" />
            </Tabs>
            <div className="monitor-table">
              {this.state.value === 0 &&
                typeof this.state.scenario.stats !== "undefined" && (
                  <OverviewTab summary={this.state.scenario} />
                )}
              {this.state.value === 1 && (
                <div className="monitor-table-content logger">
                  {this.state.log}
                </div>
              )}
              {this.state.value === 2 &&
                typeof this.state.scenario.stats !== "undefined" && (
                  <HistoryTab summary={this.state.scenario} />
                )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default GraphView;
