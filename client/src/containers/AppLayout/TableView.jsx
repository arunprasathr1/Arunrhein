import React, { Component } from "react";
import colProp from "../../assets/config/columnConfig.json";

class TableView extends Component {
  state = {
    addClass: false,
    scenarios: []
  };

  componentDidMount() {
    fetch("/api/scenarios")
      .then(res => res.json())
      .then(
        scenarios => this.setState({ scenarios }) //, () =>
        //console.log("Scenarios fetched...", scenarios)
        //)
      );
  }

  getDescription = text => {
    return text.split("\n").map((i, key) => {
      return <div key={key}>{i}</div>;
    });
  };

  toggle = keyVal => {
    this.setState({ addClass: !this.state.addClass });
    this.props.onClickSetState(keyVal);
  };

  noToggle = keyVal => {
    this.props.onClickSetState(keyVal);
  };
  render() {
    var dataColumns = colProp;
    var dataRows = this.state.scenarios;
    let tableClass = [
      "au-target monitoring-table-container pull-left listView"
    ];
    var self = this;
    var val = this.state.addClass;
    //console.log(val);
    if (this.state.addClass) {
      tableClass.push("listView-w-detail");
    }
    var tableHeaders = (
      <thead>
        <tr>
          {dataColumns.map(function(column) {
            return (
              <th
                className="au-target"
                key={column.Name}
                style={{
                  width: val ? column.onShrinkWidth : column.styleWidth
                }}
                hidden={val ? !column.onShrink : false}
              >
                {column.DisplayName}
              </th>
            );
          })}
        </tr>
      </thead>
    );

    var tableBody = dataRows.map(function(scenario) {
      return (
        <tr
          className="au-target ui7table-row"
          key={scenario.Name}
          onClick={
            !val
              ? self.toggle.bind(self, scenario)
              : self.noToggle.bind(self, scenario)
          }
        >
          {dataColumns.map(function(column) {
            return (
              <td
                key={column.Name}
                style={{
                  width: val ? column.onShrinkWidth : column.styleWidth
                }}
                hidden={val ? !column.onShrink : false}
              >
                {column.Name === "Description"
                  ? self.getDescription(scenario[column.Name])
                  : scenario[column.Name]}
              </td>
            );
          })}
        </tr>
      );
    });

    return (
      <div className={tableClass.join(" ")}>
        <div className="monitoring-home-header layout-row">
          <div className="monitoring-home-header-title">
            <span className="au-target monitoring-home-header-text wrapText shrinkTitle">
              All Scenarios
            </span>
          </div>
          <div className="monitoring-home-controls">
            <div className="monitoring-search-container au-target aurelia-hide">
              <div className="panel-search-toolbtn">
                <span className="search-clear au-target aurelia-hide" />
              </div>
            </div>
          </div>
        </div>
        <div className="monitoring-list hideToolbar">
          <header>
            <div className="ui7toolbar" role="toolbar">
              <div
                className=" btn-toolbar ui7table-toolbar-area"
                role="group"
              />
              <div
                className="btn-toolbar ui7table-toolbar-area ui7table-toolbar-right"
                role="group"
              >
                <div className="btn-group" role="group" />
              </div>
            </div>

            <table
              className="table table-bordered ui7table-header"
              width="100%"
            >
              {tableHeaders}
            </table>
          </header>
          <div className="ui7table-rows au-virtual-repeat au-target">
            <table className="table table-bordered table-hover" width="100%">
              <tbody>{tableBody}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default TableView;
