import React, { Component } from "react";
//import { render } from "react-dom";
import Modal from "react-modal";
import SlidingPane from "react-sliding-pane";
import "react-sliding-pane/dist/react-sliding-pane.css";
import "../App.css";

class ConfigPanel extends Component {
  componentDidMount() {
    Modal.setAppElement(this.el);
  }
  handleChange = e => {
    this.props.udConf[e.target.id]["value"] = e.target.value;
  };
  render() {
    const { destination, task } = this.props.config;
    let cf = [
      { name: "Destination", type: "text", value: destination, seq: 0 },
      { name: "Task", type: "text", value: task, seq: 1 }
    ];
    //console.log(this.props.config);

    cf = cf.sort((a, b) => (a.seq || 0) - (b.seq || 0));
    let pane = cf.map(e => (
      <div className="group" key={e.seq}>
        <label>{e.name}</label>
        <input
          id={e.seq}
          type={e.type}
          defaultValue={e.value}
          onChange={this.handleChange}
          readOnly
        />
        <span className="highlight" />
        <span className="bar" />
      </div>
    ));
    let { isPaneOpen = false } = this.props;
    return (
      <div ref={ref => (this.el = ref)}>
        <SlidingPane
          className="conf-nav-header"
          overlayClassName="some-custom-overlay-class"
          isOpen={isPaneOpen}
          title="Configuration"
          subtitle=""
          width="400px"
          onRequestClose={this.props.togglePane}
        >
          <div className="container">
            <form>
              <div id="validateBtn" />
              {pane}
            </form>
          </div>
        </SlidingPane>
      </div>
    );
  }
}

export default ConfigPanel;
