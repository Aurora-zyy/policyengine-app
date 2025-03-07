import { useContext } from "react";
import Plot from "react-plotly.js";
import { ChartLogo } from "../../../api/charts";
import { cardinal } from "../../../api/language";
import { formatVariableValue } from "../../../api/variables";
import HoverCard, { HoverCardContext } from "../../../layout/HoverCard";
import useMobile from "../../../layout/Responsive";
import DownloadableScreenshottable from "./DownloadableScreenshottable";
import style from "../../../style";
import DownloadCsvButton from "./DownloadCsvButton";
import { avgChangeDirection, plotLayoutFont } from "./utils";
import React, { useRef } from "react";

export default function AverageImpactByDecile(props) {
  const { impact, policyLabel, metadata, preparingForScreenshot } = props;
  const mobile = useMobile();

  function AverageImpactByDecilePlot() {
    const setHoverCard = useContext(HoverCardContext);
    // Decile bar chart. Bars are grey if negative, green if positive.
    return (
      <Plot
        data={[
          {
            x: Object.keys(impact.decile.average),
            y: Object.values(impact.decile.average),
            type: "bar",
            marker: {
              color: Object.values(impact.decile.average).map((value) =>
                value < 0 ? style.colors.DARK_GRAY : style.colors.DARK_GREEN,
              ),
            },
            text: Object.values(impact.decile.average).map(
              (value) =>
                metadata.currency +
                value.toLocaleString("en-GB", { maximumFractionDigits: 0 }),
            ),
            textangle: 0,
            hoverinfo: "none",
          },
        ]}
        layout={{
          xaxis: {
            title: "Income decile",
            tickvals: Object.keys(impact.decile.average),
          },
          yaxis: {
            title: "Average change",
            tickprefix: metadata.countryId === "uk" ? "£" : "$",
            tickformat: ",.0f",
          },
          showlegend: false,
          uniformtext: {
            mode: "hide",
            minsize: mobile ? 4 : 8,
          },
          ...ChartLogo(mobile ? 0.97 : 0.97, mobile ? -0.25 : -0.15),
          margin: {
            t: 0,
            b: 80,
            l: 60,
            r: 20,
          },
          height: mobile ? 300 : 500,
          ...plotLayoutFont,
        }}
        config={{
          displayModeBar: false,
          responsive: true,
        }}
        style={{
          width: "100%",
          marginBottom: !mobile && 50,
        }}
        onHover={(data) => {
          const decile = cardinal(data.points[0].x);
          const change = data.points[0].y;
          const message =
            change > 0.0001
              ? `This reform raises the income of households in the ${decile} decile by an average of ${formatVariableValue(
                  metadata.variables.household_net_income,
                  change,
                  0,
                )} per year.`
              : change < -0.0001
              ? `This reform lowers the income of households in the ${decile} decile by an average of ${formatVariableValue(
                  metadata.variables.household_net_income,
                  -change,
                  0,
                )} per year.`
              : change === 0
              ? `This reform has no impact on the income of households in the ${decile} decile.`
              : (change > 0 ? "This reform raises " : "This reform lowers ") +
                ` the income of households in the ${decile} decile by less than 0.01%.`;
          setHoverCard({
            title: `Decile ${data.points[0].x}`,
            body: message,
          });
        }}
        onUnhover={() => {
          setHoverCard(null);
        }}
      />
    );
  }

  const averageChange =
    -impact.budget.budgetary_impact / impact.budget.households;
  const screenshotRef = useRef();
  const urlParams = new URLSearchParams(window.location.search);
  const region = urlParams.get("region");
  const options = metadata.economy_options.region.map((region) => {
    return { value: region.name, label: region.label };
  });
  const label =
    region === "us" || region === "uk"
      ? ""
      : "in " + options.find((option) => option.value === region)?.label;

  const data = Object.entries(impact.decile.average).map(([key, value]) => [
    `Decile ${key}`,
    value,
  ]);
  const downloadButtonStyle = {
    position: "absolute",
    bottom: "40px",
    left: "55px",
  };

  return (
    <>
      <DownloadableScreenshottable ref={screenshotRef}>
        <h2 style={{ width: "700px", wordWrap: "break-word" }}>
          {`${policyLabel} ${avgChangeDirection(
            averageChange,
          )} the net income of households ${label} by ${formatVariableValue(
            metadata.variables.household_net_income,
            Math.abs(averageChange),
            0,
          )} on average`}
        </h2>
        <HoverCard>
          <AverageImpactByDecilePlot />
        </HoverCard>
      </DownloadableScreenshottable>
      <div className="chart-container">
        {!mobile && (
          <DownloadCsvButton
            preparingForScreenshot={preparingForScreenshot}
            content={data}
            filename={`absoluteImpactByIncomeDecile${policyLabel}.csv`}
            style={downloadButtonStyle}
          />
        )}
      </div>
      <p>
        The chart above shows the relative change in income for each income
        decile. Households are sorted into ten equally-populated groups
        according to their equivalised household net income.
      </p>
    </>
  );
}
