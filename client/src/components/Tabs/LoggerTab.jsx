import React, { Component } from "react";

class LoggerTab extends Component {
  render() {
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
              <label className="monitor-list-key au-target">Status</label>
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
                Submitted Time
              </label>
              <span className="monitor-list-value">{summary.initTime}</span>
            </div>
          </div>
        </div>
        <div className="monitor-table-row">
          <div className="col-sm-4 monitor-list">
            <div className="form-group">
              <label className="monitor-list-key au-target">Start Time</label>
              <span className="monitor-list-value">{summary.startTime}</span>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="form-group">
              <label className="monitor-list-key au-target">End Time</label>
              <span className="monitor-list-value">{summary.endTime}</span>
            </div>
          </div>
        </div>
        <div className="monitor-table-row">
          <div className="col-sm-4 monitor-list">
            <div className="form-group">
              <label className="monitor-list-key au-target">Message</label>
              <span className="monitor-list-value" />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default OverviewTab;
