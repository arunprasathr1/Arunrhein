import React from "react";

class Diagram extends React.Component {
  static defaultProps = {
    ds: []
  };

  componentDidMount() {
    this.renderSAPIcons();
  }

  renderSAPIcons = () => {
    let circleIcon = new window.sap.ui.core.Icon({
      src: window.sap.ui.core.IconPool.getIconURI("circle-task")
    });

    let stopIcon = new window.sap.ui.core.Icon({
      src: window.sap.ui.core.IconPool.getIconURI("stop")
    });

    circleIcon.placeAt("startNod");
    stopIcon.placeAt("endNod");
  };

  render() {
    let { ds } = this.props;
    ds = ds.sort((a, b) => (a.displaySequence || 0) - (b.displaySequence || 0));
    let rightArrow = <div className="rightArrow" />;
    let nodes = ds.map(e => (
      <div className="insideContainer" key={e.displaySequence}>
        <div className="eachNode">
          <div
            className={e.displayName}
            onClick={() => this.props.togglePanel(e)}
          />
        </div>
        {rightArrow}
      </div>
    ));
    return (
      <div className="diagramComponentContainer">
        <div id="startNod" className="sapnodes" />
        {rightArrow}
        {nodes}
        <div className="endNodeContainer">
          <div id="endNod" className="sapnodes" />
        </div>
      </div>
    );
  }
}

export default Diagram;
