import React, { Component } from 'react';
import Diagram from './Diagram';
import ConfigPanel from './ConfigPanel';

class GraphFlow extends Component {
  state = {
    ds: [],
    isPaneOpen: false,
    isPaneOpenLeft: false,
    conf: [],
    udConf: [],
    sysName: ''
  };
  validate = cf => {
    this.setState(prevState => ({
      isPaneOpen: !prevState.isPaneOpen
    }));
    this.props.valida(this.state.udConf);
    this.state.conf = this.props.udConf;
  };
  togglePane = val => {
    //console.log(val);
    if (typeof val.id === 'string' && val.id.includes('SAC')) {
      window.open(
        'https://sap-hana-dw-eng.eu1.sapbusinessobjects.cloud/sap/fpa/ui/tenants/009/app.html#;view_id=story;storyId=' +
          val.config.storyID
      );
    } else {
      {
        //console.log(val.config);
        typeof val.id === 'string' ? (this.state.conf = val.config) : (this.state.conf = []);
      }
      this.state.udConf = this.state.conf;
      this.setState(prevState => ({
        isPaneOpen: !prevState.isPaneOpen
      }));
    }
  };

  render() {
    let diagram = <Diagram ds={this.props.url.graph} togglePanel={this.togglePane} />;
    let configpanel = (
      <ConfigPanel
        isPaneOpen={this.state.isPaneOpen}
        togglePane={this.togglePane}
        config={this.state.conf}
        udConf={this.state.udConf}
        validate={this.validate}
      />
    );
    return (
      <div className="dashboard">
        {diagram}
        {configpanel}
      </div>
    );
  }
}

export default GraphFlow;
