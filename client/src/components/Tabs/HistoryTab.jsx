import React, { Component } from "react";

class HistoryTab extends Component {
  getStatusClass = status => {
    //console.log(status);
    switch (status) {
      case "Not Started":
        return "au-target label description-status-notStarted";
      case "Connection Established":
        return "au-target label description-status-completed";
      case "Invalid Configuration":
        return "au-target label description-status-dead";
      case "Running":
        return "au-target label description-status-running";
      case "Pending":
        return "au-target label description-status-pending";
      case "Completed":
        return "au-target label description-status-completed";
      default: {
        return "au-target label description-status-notStarted";
      }
    }
  };
  render() {
    //console.log(this.props.summary.stats);
    const summary = this.props.summary.stats.history;
    return (
      <div className="monitor-table-content">
        <div className="monitor-table-row">
          <div className="col-sm-4 monitor-list">
            <div className="form-group">
              <label className="monitor-list-key au-target">Name</label>
              <span className="monitor-list-value">
                {this.props.summary.name}
              </span>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="form-group">
              <label className="monitor-list-key au-target">Job ID</label>
              <span className="monitor-list-value">{summary.id}</span>
            </div>
          </div>
        </div>
        <div className="monitor-table-row">
          <div className="col-sm-4 monitor-list">
            <div className="form-group monitor-graph-status">
              <label className="monitor-list-key au-target">
                Last Execution Status
              </label>
              <span className="monitor-list-value">
                <span className={this.getStatusClass(summary.status)}>
                  {summary.status}
                </span>
              </span>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="form-group">
              <label className="monitor-list-key au-target">
                Last Execution Submitted Time
              </label>
              <span className="monitor-list-value">{summary.initTime}</span>
            </div>
          </div>
        </div>
        <div className="monitor-table-row">
          <div className="col-sm-4 monitor-list">
            <div className="form-group">
              <label className="monitor-list-key au-target">
                Last Execution Start Time
              </label>
              <span className="monitor-list-value">{summary.startTime}</span>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="form-group">
              <label className="monitor-list-key au-target">
                Last Execution End Time
              </label>
              <span className="monitor-list-value">{summary.endTime}</span>
            </div>
          </div>
        </div>
        <div className="monitor-table-row">
          <div className="col-sm-4 monitor-list">
            <div className="form-group">
              <label className="monitor-list-key au-target">Message</label>
              <span className="monitor-list-value">{summary.message}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default HistoryTab;
