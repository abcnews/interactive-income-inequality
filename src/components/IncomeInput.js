const React = require("react");
const styles = require("./IncomeInput.scss");
const ReactDOM = require("react-dom");
const Portal = require("react-portal");
const d3 = require("d3");

class IncomeInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = { income: "" };
  }
  handleIncomeChange(event) {
    let income = event.target.value;
    this.setState({ income: income });
  }
  handleEstimationChange() {
    console.log("changed...");
  }
  showMore(event) {
    console.log(this.state.income);
  }
  componentDidMount() {
    var svg = d3.select("svg"),
    margin = {right: 50, left: 50},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height");

var hueActual = 0,
    hueTarget = 70,
    hueAlpha = 0.2,
    hueTimer = d3.timer(hueTween);

var x = d3.scaleLinear()
    .domain([0, 180])
    .range([0, width])
    .clamp(true);

var slider = svg.append("g")
    .attr("class", "slider")
    .attr("transform", "translate(" + margin.left + "," + height / 2 + ")");

slider.append("line")
    .attr("class", "track")
    .attr("x1", x.range()[0])
    .attr("x2", x.range()[1])
  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-inset")
  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-overlay")
    .call(d3.drag()
        .on("start.interrupt", function() { slider.interrupt(); })
        .on("start drag", function() { hue(x.invert(d3.event.x)); }));

slider.insert("g", ".track-overlay")
    .attr("class", "ticks")
    .attr("transform", "translate(0," + 18 + ")")
  .selectAll("text")
  .data(x.ticks(10))
  .enter().append("text")
    .attr("x", x)
    .attr("text-anchor", "middle")
    .text(function(d) { return d + "°"; });

var handle = slider.insert("circle", ".track-overlay")
    .attr("class", "handle")
    .attr("r", 9);

function hue(h) {
  hueTarget = h;
  hueTimer.restart(hueTween);
}

function hueTween() {
  var hueError = hueTarget - hueActual;
  if (Math.abs(hueError) < 1e-3) hueActual = hueTarget, hueTimer.stop();
  else hueActual += hueError * hueAlpha;
  handle.attr("cx", x(hueActual));
  svg.style("background-color", d3.hsl(hueActual, 0.8, 0.8));
}
  }
  render() {
    return ReactDOM.createPortal(
      <div className={styles.wrapper}>
        <div className={styles.flexWrapper}>
          <div className={styles.column + " " + styles.one}>
            <div className={styles.boldtext}>
              Where do you think your income bracket sits on the scale of least
              to most rich Australians?
            </div>
            <div className={styles.smalltext}>
              Use the slider on the right to estimate your position
            </div>
            <div className={styles.boldtext}>
              Your income before tax is<br />
              <label>
                ${" "}
                <input
                  onChange={this.handleIncomeChange.bind(this)}
                  type="text"
                />
              </label>{" "}
              per week
            </div>
            <div className={styles.smalltext}>Enter your weekly income</div>
          </div>
          <div className={styles.column + " " + styles.two}>
            {/* <input
              onChange={this.handleEstimationChange.bind(this)}
              // orient="vertical"
              type="range"
              step="1"
              value="100"
              min="1"
              max="200"
            /> */}
            <svg className="range-slider" width="200" height="480" />
          </div>
        </div>
        <div>
          <button onClick={this.showMore.bind(this)}>
            Show me where I sit
          </button>
        </div>
      </div>,
      document.querySelector(".income-input")
    );
  }
}

module.exports = IncomeInput;
