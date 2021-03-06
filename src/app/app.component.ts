import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {Cell, CellLoop, Stream, Transaction} from 'sodiumjs';
import {CalculatorState, Operator} from './operator';
import {DigitButtonComponent} from './digit-button/digit-button.component';
import {DisplayFieldComponent} from './display-field/display-field.component';
import {OperationButtonComponent} from './operation-button/operation-button.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  // noinspection JSUnusedGlobalSymbols
  title = 'Sodium Calculator';

  @ViewChild('digit1') digit1B: DigitButtonComponent;
  @ViewChild('digit2') digit2B: DigitButtonComponent;
  @ViewChild('digit3') digit3B: DigitButtonComponent;
  @ViewChild('digit4') digit4B: DigitButtonComponent;
  @ViewChild('digit5') digit5B: DigitButtonComponent;
  @ViewChild('digit6') digit6B: DigitButtonComponent;
  @ViewChild('digit7') digit7B: DigitButtonComponent;
  @ViewChild('digit8') digit8B: DigitButtonComponent;
  @ViewChild('digit9') digit9B: DigitButtonComponent;
  @ViewChild('digit0') digit0B: DigitButtonComponent;
  @ViewChild('display') displayF: DisplayFieldComponent;
  @ViewChild('plus') plusB: OperationButtonComponent;
  @ViewChild('minus') minusB: OperationButtonComponent;
  @ViewChild('compute') computeB: OperationButtonComponent;

  // noinspection JSUnusedGlobalSymbols
  ngOnInit() {
    console.log("ngOnInit() - AppComponent");
  }

  ngAfterViewInit() {
    console.log("ngAfterViewInit() - AppComponent");
    this.displayF.displayC = Transaction.run(() => {
      const statusC = new CellLoop<CalculatorState>();

      const updatedStateS = this.wireDigitAndOperatorStreams(statusC);

      statusC.loop(
        updatedStateS.hold(
          new CalculatorState(0, 0, 0, Operator.None)));

      const displayC = statusC.map(status => status.display);

      return displayC;
    });
  }

   private wireDigitAndOperatorStreams(statusC) {
    const updatedEnteredNumberS = this.wireDigitStream(statusC);

    const updatedStateFromCompute = this.wireComputeStream(statusC);

    const updatedStateFromOperatorS = this.wireOperators(statusC);

    return updatedEnteredNumberS
      .orElse(updatedStateFromOperatorS)
      .orElse(updatedStateFromCompute);
  }

  private wireDigitStream(statusC: Cell<CalculatorState>): Stream<CalculatorState> {
    const digitS = this.combineDigitStreams();
    return digitS.snapshot(
      statusC,
      (dig, status) =>
        status.withDisplayAndMain(status.main * 10 + dig));
  }

  private combineDigitStreams(): Stream<number> {
    return this.digit0B.stream
      .orElse(this.digit1B.stream)
      .orElse(this.digit2B.stream)
      .orElse(this.digit3B.stream)
      .orElse(this.digit4B.stream)
      .orElse(this.digit5B.stream)
      .orElse(this.digit6B.stream)
      .orElse(this.digit7B.stream)
      .orElse(this.digit8B.stream)
      .orElse(this.digit9B.stream)
      .orElse(this.digit0B.stream);
  }

  private wireOperators(statusC: Cell<CalculatorState>) {
    const plusS = this.plusB.stream.mapTo(Operator.Plus);

    const minusS: Stream<Operator> = this.minusB.stream.mapTo(Operator.Minus);

    const operatorS: Stream<Operator> = plusS.orElse(minusS);

    return operatorS.snapshot(statusC,
      (op, status) =>
        status.applyActiveOperatorAndSetOperator(op));
  }

  private wireComputeStream(statusC: Cell<CalculatorState>): Stream<CalculatorState> {
    return this.computeB.stream
      .snapshot(statusC,
        (u, status) =>
          status
            .applyActiveOperatorAndSetOperator(Operator.None)
            .resetMainAndback());
  }

}
