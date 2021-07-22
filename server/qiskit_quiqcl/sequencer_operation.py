import numpy as np

import legacy.Sequencer as seq
from legacy.Sequencer import reg, su

############## parameters/constants ##############
INT16_MAX = 0xFFFF

OUTPUT_ON = 1
OUTPUT_OFF = 0
##################################################


def wait_microsec(s, wait_time, num_head_cycles=0):
    """
    add wait instructions at the end of the sequencer(s)

    Arguments
        s: Sequencer
        wait_time: time to wait in microseconds
        num_head_cycles: number of previous instruction cycles to include in this duration
                         useful when considering the total duration of an instruction

    Return
        s: Sequencer
    """
    wait_cycle = wait_time * 100
    wait_cycle -= num_head_cycles

    if wait_cycle < 1:
        return

    long_waits, wait_cycle = divmod(round(wait_cycle), INT16_MAX + 3)
    for _ in range(long_waits):
        s.wait_n_clocks(INT16_MAX)
    
    if wait_cycle > 3:
        s.wait_n_clocks(wait_cycle - 3)
    else:
        for _ in range(wait_cycle):
            s.nop()

    return


# class HardwareDefinition:
#     """
#     class definition of HardwareDefinition.
#     currently, just a placeholder of pins
#     """
#     def __init__(self):
#         super().__init__()

#     def __setitem__(self, key, value):
#         setattr(self, key, value)

#     def __getitem__(self, key):
#         return getattr(self, key)


class SequencerOperation:
    """
    An Abstract Base Class of SequencerOperation.
    Need to inherit this class and define the required outputs, counters and phase_shifters
    """
    def __init__(self, hd, **kwargs):
        """
        Arguments
            hd: HardwareDefintion
            kwargs: if hd is not a sufficient hardware definition, 
                    you can provide more definitions through kwargs
                    However to avoid confusion when using hd,
                    the values in hd have priority over the values in kwargs
                    i.e. only the values not in hd will be added
        """
        self.hd = hd.__dict__

        for key in kwargs.keys():
            if key not in self.hd.keys():
                self.hd[key] = kwargs[key]

        # check if all required hardware definitions are provided
        undefined_hardwares = []
        for hardware in self.outputs:
            if hardware + "_out" not in self.hd.keys():
                undefined_hardwares.append(hardware + "(output)")
        for hardware in self.counters:
            if hardware + "_counter_result" not in self.hd.keys():
                undefined_hardwares.append(hardware + "(counter)")
        for hardware in self.phase_shifters:
            if hardware + "_port" not in self.hd.keys():
                undefined_hardwares.append(hardware + "(phase_shifter)")

        if undefined_hardwares:
            raise Exception("Hardware Definitions of {} are not provided.".format(undefined_hardwares))

    def x_rotation(self, qubits, angle):
        raise NotImplementedError
        
    def y_rotation(self, qubits, angle):
        raise NotImplementedError
        
    def xx_rotation(self, qubits, angle):
        raise NotImplementedError
        
    def molmer_sorenson(self, qubits, angle):
        """alias of xx_rotation"""
        return self.xx_rotation(qubits, angle)
        
    def id(self, qubits, angle):
        raise NotImplementedError
        
    def measure(self, qubits):
        raise NotImplementedError
        
    def detect(self, qubits):
        """alias of measure"""
        return self.measure(qubits)
        
    def barrier(self, quiqcl_circuit):
        raise NotImplementedError
        
    def cooling(self, qubits):
        raise NotImplementedError
        
    def qubit_initialize(self, qubits):
        raise NotImplementedError
        
    def merge_operations(self, *args):
        """
        used for merging two or more operations.
        for example, when different gates are done on different qubits,
        this method is used with the gates as input arguements

        This method checks if different operations can be merged(run parellel) or not.
        (i.e. if there are no confilicting operations)
        If the operations cannot be run in parellel, just extend the length of the list
        
        args: list of returns from each operation methods
        """
        op_list = []
        for arg in args:
            op_list.extend(arg)

        return op_list

    def operations_to_sequencer(self, s, ops):
        """
        Converts each operation in ops to Sequencer instructions.
        Each instruction is directly programmed in s

        Arguments
            s: SequencerProgram.
            ops: list of dictionaries. SequencerOperation data structure

        Returns
            None
        """
        raise NotImplementedError

    def quiqcl_circuit_to_sequencer(self, quiqcl_circuit):
        """
        Converts quiqcl_circuit into SequencerProgram

        Arguments
            quiqcl_circuit: Dictionary. QuiqclCircuit data structure

        Returns
            SequencerProgram that holds the program for quiqcl_circuit
        """
        raise NotImplementedError


class ChipTrapSequencerOperation(SequencerOperation):
    outputs = ["Microwave_12_6GHz", 
               "EOM_14_7GHz", 
               "EOM_2_1GHz_off", 
               "AOM_off"]
    counters = ["PMT1"]
    phase_shifters = ["Microwave_phase_shifter"]
    serial = "COM32"

    # times are in microseconds
    COOLING_TIME = 1000
    INTIALIZE_TIME = 100
    X_DURATION = 100
    X_PHASE_ANGLE = 0
    Y_DURATION = 100
    Y_PHASE_ANGLE = 180
    # XX_DURATION
    ID_DURATION = 100
    PHASE_SHIFT_DURATION = 100
    DETECT_DURATION = 1000
    ZERO_THRESHOLD = 1.5

    def x_rotation(self, qubits, angle):
        duration = angle / np.pi * self.X_DURATION
        return [{
            "label": "x_gate",
            "outputs": {
                "Microwave_12_6GHz": OUTPUT_ON,
                "EOM_14_7GHz": OUTPUT_OFF, 
                "EOM_2_1GHz_off": OUTPUT_ON, 
                "AOM_off": OUTPUT_OFF
            },
            "duration": duration,
            "phase_angle": self.X_PHASE_ANGLE
        }]

    def y_rotation(self, qubits, angle):
        duration = angle / np.pi * self.Y_DURATION
        return [{
            "label": "y_gate",
            "outputs": {
                "Microwave_12_6GHz": OUTPUT_ON,
                "EOM_14_7GHz": OUTPUT_OFF, 
                "EOM_2_1GHz_off": OUTPUT_ON, 
                "AOM_off": OUTPUT_OFF
            },
            "duration": duration,
            "phase_angle": self.Y_PHASE_ANGLE
        }]

    def xx_rotation(self, qubits, angle):
        # not yet implemented
        return [{
            "label": "xx_gate"
        }]

    def id(self, qubits):
        # no action
        return [{
            "label": "id_gate",
            "outputs": {
                "Microwave_12_6GHz": OUTPUT_OFF,
                "EOM_14_7GHz": OUTPUT_OFF, 
                "EOM_2_1GHz_off": OUTPUT_ON, 
                "AOM_off": OUTPUT_OFF
            },
            "duration": self.ID_DURATION
        }]

    def measure(self, qubits, clbits):
        return [{
            "label": "measure",
            "outputs": {
                "Microwave_12_6GHz": OUTPUT_OFF,
                "EOM_14_7GHz": OUTPUT_OFF, 
                "EOM_2_1GHz_off": OUTPUT_ON, 
                "AOM_off": OUTPUT_ON
            },
            "counters": {
                "PMT1": OUTPUT_ON
            },
            "duration": self.DETECT_DURATION,
            "clbit": clbits[0]
        }]

    def barrier(self, qubits):
        # no action
        return [{
            "label": "barrier"
        }]

    def cooling(self, qubits):
        return [{
            "label": "cooling",
            "outputs": {
                "Microwave_12_6GHz": OUTPUT_OFF,
                "EOM_14_7GHz": OUTPUT_ON, 
                "EOM_2_1GHz_off": OUTPUT_ON, 
                "AOM_off": OUTPUT_ON
            },
            "duration": self.COOLING_TIME,
        }]

    def qubit_initialize(self, qubits):
        return [{
            "label": "qubit_initialize",
            "outputs": {
                "Microwave_12_6GHz": OUTPUT_OFF,
                "EOM_14_7GHz": OUTPUT_OFF, 
                "EOM_2_1GHz_off": OUTPUT_OFF, 
                "AOM_off": OUTPUT_ON
            },
            "duration": self.INTIALIZE_TIME,
            "phase_angle": 0
        }]

    def detect(self, qubits, clbits):
        return self.measure(qubits, clbits)

    def sequencer_initialize(self):
        return [{
            "label": "sequencer_initialize",
            "outputs": {
                "Microwave_12_6GHz": OUTPUT_OFF,
                "EOM_14_7GHz": OUTPUT_OFF, 
                "EOM_2_1GHz_off": OUTPUT_ON, 
                "AOM_off": OUTPUT_ON
            },
            "counters": {
                "PMT1": OUTPUT_OFF
            },
            "phase_angle": 0
        }]

    def sequencer_end(self):
        return [{
            "label": "sequencer_end",
            "outputs": {
                "Microwave_12_6GHz": OUTPUT_OFF,
                "EOM_14_7GHz": OUTPUT_OFF, 
                "EOM_2_1GHz_off": OUTPUT_ON, 
                "AOM_off": OUTPUT_ON
            },
            "counters": {
                "PMT1": OUTPUT_OFF
            },
            "phase_angle": 0
        }]

    def operations_to_sequencer(self, s, ops):
        # maybe we need a better encoding scheme that can represent clbits
        n_writes = 0
        for op in ops:
            outputs = [(self.hd[k + "_out"], v) for k, v in op["outputs"].items()] if "outputs" in op.keys() else []
            
            counters = [(self.hd[k + "_counter_enable"], v) for k, v in op["counters"].items()] if "counters" in op.keys() else []
            enabled_counters = [k for k, v in op["counters"].items() if v] if "counters" in op.keys() else []
            clbit = op["clbit"] if "clbit" in op.keys() else None
            duration = op["duration"] if "duration" in op.keys() else 0
            phase_angle = op["phase_angle"] if "phase_angle" in op.keys() else -1

            label_idx = len(s.program_list)

            if phase_angle != -1:
                s.set_output_port(self.hd["external_control_port"],
                    [("Microwave_12_6GHz", 0), ("EOM_14_7GHz", 0), ("EOM_2_1GHz_off", 1), ("AOM_off", 1)])
                s.set_output_port(self.hd["Microwave_phase_shifter_port"], su.phase_angle_to_bit_string(phase_angle, 12), 0xFFFF)
                wait_microsec(s, self.PHASE_SHIFT_DURATION, 1)
            if enabled_counters:
                # if there are any enabled counters
                s.set_output_port(self.hd["counter_control_port"], counters)
                s.set_output_port(self.hd["external_control_port"], outputs)
                s.trigger_out([self.hd[counter + "_counter_reset"] for counter in enabled_counters])
                
                wait_microsec(s, duration, 2)  # accurate time for outputs
                
                s.set_output_port(self.hd["counter_control_port"], 
                    [(self.hd[counter + "_counter_enable"], 0) for counter in enabled_counters])
                for i, counter in enumerate(enabled_counters):
                    s.read_counter(reg[i], self.hd[counter + "_counter_result"])
                    if i >= 31:
                        raise Exception("Too many counters being used. Currently 31 counters can be used at maximum")
                for i in range(len(enabled_counters) // 3):
                    s.write_to_fifo(reg[3*i], reg[3*i + 1], reg[3*i + 2], 
                                    su.event_label_encode(n_writes, 
                                                          self.hd[enabled_counters[3*i] + "_counter_result"],
                                                          self.hd[enabled_counters[3*i + 1] + "_counter_result"],
                                                          self.hd[enabled_counters[3*i + 2] + "_counter_result"]))
                    n_writes += 1
                if len(enabled_counters) % 3 == 1:
                    s.write_to_fifo(reg[len(enabled_counters) - 1], reg[len(enabled_counters) - 1], reg[len(enabled_counters) - 1], 
                                    su.event_label_encode(n_writes, 
                                                          self.hd[enabled_counters[len(enabled_counters) - 1] + "_counter_result"],
                                                          self.hd[enabled_counters[len(enabled_counters) - 1] + "_counter_result"],
                                                          self.hd[enabled_counters[len(enabled_counters) - 1] + "_counter_result"]))
                    n_writes += 1

                elif len(enabled_counters) % 3 == 2:
                    s.write_to_fifo(reg[len(enabled_counters) - 2], reg[len(enabled_counters) - 1], reg[len(enabled_counters) - 1], 
                                    su.event_label_encode(n_writes, 
                                                          self.hd[enabled_counters[len(enabled_counters) - 2] + "_counter_result"],
                                                          self.hd[enabled_counters[len(enabled_counters) - 1] + "_counter_result"],
                                                          self.hd[enabled_counters[len(enabled_counters) - 1] + "_counter_result"]))
                    n_writes += 1

            else:
                # there are no enabled counters.
                # there should still be set_output_port for counters in case of disabling counters
                s.set_output_port(self.hd["external_control_port"], outputs)
                s.set_output_port(self.hd["counter_control_port"], counters)
                wait_microsec(s, duration, 2)  # accurate time for outputs

            i = 0
            while op["label"] + "_" + str(i) in s.__dict__.keys():
                i += 1
            label = op["label"] + "_" + str(i)
            setattr(s, label, s.program_list[label_idx])

    def quiqcl_circuit_to_sequencer(self, quiqcl_circuit):
        circuit = quiqcl_circuit["circuit"]
        n_qubits = quiqcl_circuit["num_qubits"]
        shots = quiqcl_circuit["shots"]

        s = seq.SequencerProgram()
        for i in range(32):
            s.load_immediate(reg[i], 0)

        ops = []
        ops.extend(self.sequencer_initialize())
        self.operations_to_sequencer(s, ops)

        branch_to = len(s.program_list)

        ops = []
        ops.extend(self.cooling(range(n_qubits)))
        ops.extend(self.qubit_initialize(range(n_qubits)))

        for layer in circuit:
            layer_to_op = []
            for op in layer:
                if op["op"] == "rx":
                    layer_to_op.append(self.x_rotation(op["qargs"], op["params"][0]))
                elif op["op"] == "ry":
                    layer_to_op.append(self.y_rotation(op["qargs"], op["params"][0]))
                elif op["op"] == "rxx":
                    layer_to_op.append(self.xx_rotation(op["qargs"], op["params"][0]))
                elif op["op"] == "id":
                    layer_to_op.append(self.id(op["qargs"]))
                elif op["op"] == "measure":
                    layer_to_op.append(self.measure(op["qargs"], op["cargs"]))
                elif op["op"] == "barrier":
                    layer_to_op.append(self.barrier(op["qargs"]))
                else:
                    # this is in fact error
                    pass
                ops.extend(self.merge_operations(*layer_to_op))
        ops.extend(self.sequencer_end())
        
        self.operations_to_sequencer(s, ops)
        if shots > 1:
            s.add(reg[31], reg[31], 1)
            s.branch_if_less_than(branch_to, reg[31], shots)

        return s


class BladeTrapSequencerOperation(SequencerOperation):
    outputs = ["Cooling_Beam_AOM", 
               "Detection_Beam_AOM", 
               "Initialization_Beam_AOM", 
               "Microwave_Antenna_Switch",
               "Test_ja_7_auto"]
    counters = ["PMT1"]
    phase_shifters = []
    # phase_shifters = ["Test_ja_7_auto"]
    serial = "COM32"

    # times are in microseconds
    COOLING_TIME = 1000
    INTIALIZE_TIME = 100
    X_DURATION = 64
    X_PHASE_ANGLE = 0
    Y_DURATION = 68
    Y_PHASE_ANGLE = 90
    ID_DURATION = 100
    # XX_DURATION
    PHASE_SHIFT_DURATION = 10
    DETECT_DURATION = 3000
    ZERO_THRESHOLD = 3

    def x_rotation(self, qubits, angle):
        while angle <= 0:
            angle += np.pi * 2
        duration = angle / np.pi * self.X_DURATION
        return [{
            "label": "x_gate",
            "outputs": {
                "Cooling_Beam_AOM": OUTPUT_OFF, 
                "Detection_Beam_AOM": OUTPUT_OFF, 
                "Initialization_Beam_AOM": OUTPUT_OFF, 
                # "Test_ja_7_auto": OUTPUT_OFF,
                "Microwave_Antenna_Switch": OUTPUT_ON
            },
            "duration": duration,
            "phase_angle": self.X_PHASE_ANGLE
        }]

    def y_rotation(self, qubits, angle):
        while angle <= 0:
            angle += np.pi * 2
        duration = angle / np.pi * self.Y_DURATION
        return [{
            "label": "y_gate",
            "outputs": {
                "Cooling_Beam_AOM": OUTPUT_OFF, 
                "Detection_Beam_AOM": OUTPUT_OFF, 
                "Initialization_Beam_AOM": OUTPUT_OFF, 
                # "Test_ja_7_auto": OUTPUT_ON,
                "Microwave_Antenna_Switch": OUTPUT_ON
            },
            "duration": duration,
            "phase_angle": self.Y_PHASE_ANGLE
        }]

    def xx_rotation(self, qubits, angle):
        # not yet implemented
        return [{
            "label": "xx_gate"
        }]

    def id(self, qubits):
        # no action
        return [{
            "label": "id_gate",
            "outputs": {
                "Cooling_Beam_AOM": OUTPUT_OFF, 
                "Detection_Beam_AOM": OUTPUT_OFF, 
                "Initialization_Beam_AOM": OUTPUT_OFF, 
                # "Test_ja_7_auto": OUTPUT_OFF,
                "Microwave_Antenna_Switch": OUTPUT_OFF
            },
            "duration": self.ID_DURATION
        }]

    def measure(self, qubits, clbits):
        return [{
            "label": "measure",
            "outputs": {
                "Cooling_Beam_AOM": OUTPUT_OFF, 
                "Detection_Beam_AOM": OUTPUT_ON, 
                "Initialization_Beam_AOM": OUTPUT_OFF, 
                # "Test_ja_7_auto": OUTPUT_OFF,
                "Microwave_Antenna_Switch": OUTPUT_OFF
            },
            "counters": {
                "PMT1": OUTPUT_ON
            },
            "duration": self.DETECT_DURATION,
            "clbit": clbits[0]
        }]

    def barrier(self, qubits):
        # no action
        return [{
            "label": "barrier"
        }]

    def cooling(self, qubits):
        return [{
            "label": "cooling",
            "outputs": {
                "Cooling_Beam_AOM": OUTPUT_ON, 
                "Detection_Beam_AOM": OUTPUT_OFF, 
                "Initialization_Beam_AOM": OUTPUT_OFF, 
                # "Test_ja_7_auto": OUTPUT_OFF,
                "Microwave_Antenna_Switch": OUTPUT_OFF
            },
            "duration": self.COOLING_TIME,
        }]

    def qubit_initialize(self, qubits):
        return [{
            "label": "qubit_initialize",
            "outputs": {
                "Cooling_Beam_AOM": OUTPUT_OFF, 
                "Detection_Beam_AOM": OUTPUT_OFF, 
                "Initialization_Beam_AOM": OUTPUT_ON, 
                # "Test_ja_7_auto": OUTPUT_OFF,
                "Microwave_Antenna_Switch": OUTPUT_OFF
            },
            "duration": self.INTIALIZE_TIME,
            "phase_angle": 0
        }]

    def detect(self, qubits, clbits):
        return self.measure(qubits, clbits)

    def sequencer_initialize(self):
        return [{
            "label": "sequencer_initialize",
            "outputs": {
                "Cooling_Beam_AOM": OUTPUT_OFF, 
                "Detection_Beam_AOM": OUTPUT_OFF, 
                "Initialization_Beam_AOM": OUTPUT_OFF, 
                # "Test_ja_7_auto": OUTPUT_OFF,
                "Microwave_Antenna_Switch": OUTPUT_OFF
            },
            "counters": {
                "PMT1": OUTPUT_OFF
            },
            "phase_angle": 0
        }]

    def sequencer_end(self):
        return [{
            "label": "sequencer_end",
            "outputs": {
                "Cooling_Beam_AOM": OUTPUT_ON, 
                "Detection_Beam_AOM": OUTPUT_OFF, 
                "Initialization_Beam_AOM": OUTPUT_OFF, 
                # "Test_ja_7_auto": OUTPUT_OFF,
                "Microwave_Antenna_Switch": OUTPUT_OFF
            },
            "counters": {
                "PMT1": OUTPUT_OFF
            },
            "phase_angle": 0,
            "duration": self.COOLING_TIME
        }]

    def operations_to_sequencer(self, s, ops):
        # maybe we need a better encoding scheme that can represent clbits
        n_writes = 0
        for op in ops:
            outputs = [(self.hd[k + "_out"], v) for k, v in op["outputs"].items()] if "outputs" in op.keys() else []
            
            counters = [(self.hd[k + "_counter_enable"], v) for k, v in op["counters"].items()] if "counters" in op.keys() else []
            enabled_counters = [k for k, v in op["counters"].items() if v] if "counters" in op.keys() else []
            clbit = op["clbit"] if "clbit" in op.keys() else None
            duration = op["duration"] if "duration" in op.keys() else 0
            phase_angle = op["phase_angle"] if "phase_angle" in op.keys() else -1

            label_idx = len(s.program_list)

            if phase_angle != -1:
                if phase_angle == self.Y_PHASE_ANGLE:
                    s.set_output_port(self.hd["external_control_port"], 
                        [(self.hd["Test_ja_7_auto_out"], 1)] + [(self.hd[output + "_out"], 0) for output in self.outputs if output != "Test_ja_7_auto"])
                elif phase_angle == self.X_PHASE_ANGLE:
                    s.set_output_port(self.hd["external_control_port"], 
                        [(self.hd["Test_ja_7_auto_out"], 0)] + [(self.hd[output + "_out"], 0) for output in self.outputs if output != "Test_ja_7_auto"])
                wait_microsec(s, self.PHASE_SHIFT_DURATION, 1)
            if enabled_counters:
                # if there are any enabled counters
                s.set_output_port(self.hd["counter_control_port"], counters)
                s.set_output_port(self.hd["external_control_port"], outputs)
                s.trigger_out([self.hd[counter + "_counter_reset"] for counter in enabled_counters])
                
                wait_microsec(s, duration, 2)  # accurate time for outputs
                
                s.set_output_port(self.hd["counter_control_port"], 
                    [(self.hd[counter + "_counter_enable"], 0) for counter in enabled_counters])
                for i, counter in enumerate(enabled_counters):
                    s.read_counter(reg[i], self.hd[counter + "_counter_result"])
                    if i >= 31:
                        raise Exception("Too many counters being used. Currently 31 counters can be used at maximum")
                for i in range(len(enabled_counters) // 3):
                    s.write_to_fifo(reg[3*i], reg[3*i + 1], reg[3*i + 2], 
                                    su.event_label_encode(n_writes, 
                                                          self.hd[enabled_counters[3*i] + "_counter_result"],
                                                          self.hd[enabled_counters[3*i + 1] + "_counter_result"],
                                                          self.hd[enabled_counters[3*i + 2] + "_counter_result"]))
                    n_writes += 1
                if len(enabled_counters) % 3 == 1:
                    s.write_to_fifo(reg[len(enabled_counters) - 1], reg[len(enabled_counters) - 1], reg[len(enabled_counters) - 1], 
                                    su.event_label_encode(n_writes, 
                                                          self.hd[enabled_counters[len(enabled_counters) - 1] + "_counter_result"],
                                                          self.hd[enabled_counters[len(enabled_counters) - 1] + "_counter_result"],
                                                          self.hd[enabled_counters[len(enabled_counters) - 1] + "_counter_result"]))
                    n_writes += 1

                elif len(enabled_counters) % 3 == 2:
                    s.write_to_fifo(reg[len(enabled_counters) - 2], reg[len(enabled_counters) - 1], reg[len(enabled_counters) - 1], 
                                    su.event_label_encode(n_writes, 
                                                          self.hd[enabled_counters[len(enabled_counters) - 2] + "_counter_result"],
                                                          self.hd[enabled_counters[len(enabled_counters) - 1] + "_counter_result"],
                                                          self.hd[enabled_counters[len(enabled_counters) - 1] + "_counter_result"]))
                    n_writes += 1

            else:
                # there are no enabled counters.
                # there should still be set_output_port for counters in case of disabling counters
                s.set_output_port(self.hd["counter_control_port"], counters)
                s.set_output_port(self.hd["external_control_port"], outputs)
                s.trigger_out([self.hd[counter + "_counter_reset"] for counter in enabled_counters])
                wait_microsec(s, duration, 2)  # accurate time for outputs

            i = 0
            while op["label"] + "_" + str(i) in s.__dict__.keys():
                i += 1
            label = op["label"] + "_" + str(i)
            setattr(s, label, s.program_list[label_idx])

    def quiqcl_circuit_to_sequencer(self, quiqcl_circuit):
        circuit = quiqcl_circuit["circuit"]
        n_qubits = quiqcl_circuit["num_qubits"]
        shots = quiqcl_circuit["shots"]

        s = seq.SequencerProgram()
        for i in range(32):
            s.load_immediate(reg[i], 0)

        ops = []
        ops.extend(self.sequencer_initialize())
        self.operations_to_sequencer(s, ops)

        branch_to = len(s.program_list)

        ops = []
        ops.extend(self.cooling(range(n_qubits)))
        ops.extend(self.qubit_initialize(range(n_qubits)))

        for layer in circuit:
            layer_to_op = []
            for op in layer:
                if op["op"] == "rx":
                    layer_to_op.append(self.x_rotation(op["qargs"], op["params"][0]))
                elif op["op"] == "ry":
                    layer_to_op.append(self.y_rotation(op["qargs"], op["params"][0]))
                elif op["op"] == "rxx":
                    layer_to_op.append(self.xx_rotation(op["qargs"], op["params"][0]))
                elif op["op"] == "id":
                    layer_to_op.append(self.id(op["qargs"]))
                elif op["op"] == "measure":
                    layer_to_op.append(self.measure(op["qargs"], op["cargs"]))
                elif op["op"] == "barrier":
                    layer_to_op.append(self.barrier(op["qargs"]))
                else:
                    # this is in fact error
                    pass
                ops.extend(self.merge_operations(*layer_to_op))
        ops.extend(self.sequencer_end())

        self.operations_to_sequencer(s, ops)
        if shots > 1:
            s.add(reg[31], reg[31], 1)
            s.branch_if_less_than(branch_to, reg[31], shots)
        s.stop()

        return s

def run_quiqcl_circuit(quiqcl_circuit, backend):
    """Runs the given quiqcl_circuit on sequencer.
    
    Args:
        quiqcl_circuit: A circuit to run, in quiqcl_circuit format.
        backend: The desired backend on which the circuit will run.

    Returns:
        A dictionary which contains the results, in two formats: 'samples' and
          'rabi'.
        TODO(kangz12345@gmail.com): more description of the result formats.
    """
    if backend == "quiqcl_chip_trap":
        hd = seq.chip_hd
        so = ChipTrapSequencerOperation(hd)

    if backend == "quiqcl_blade_trap":
        hd = seq.blade_hd
        so = BladeTrapSequencerOperation(hd)

    sp = so.quiqcl_circuit_to_sequencer(quiqcl_circuit)
    sequencer = seq.ArtyS7(so.serial)
    sp.program(show=False, target=sequencer)

    sequencer.auto_mode()
    sequencer.start_sequencer()
    
    data = []
    while sequencer.sequencer_running_status() == 'running':
        data_count = sequencer.fifo_data_length()
        data += sequencer.read_fifo_data(data_count)

    data_count = sequencer.fifo_data_length()
    while data_count > 0:
        data += sequencer.read_fifo_data(data_count)
        data_count = sequencer.fifo_data_length()
    sequencer.close()
        
    # rabi-type data processing
    data_dict = {}
    samples = []
    for counter in so.counters:
        data_dict[counter] = {}

    counter_index_to_input = dict()
    for key, counter_index in hd.__dict__.items():
        if key.endswith("_counter_result"):
            for counter in hd.input_mapping.values():
                if counter in key:
                    counter_index_to_input[counter_index] = counter

    for packet in data:
        # currently we ignore clbits but for further updates, they have to be considered
        n_writes, counter_index1, counter_index2, counter_index3 = su.event_label_decode(packet[3])
        counter_indices = [counter_index1, counter_index2, counter_index3]

        for i, counter_index in enumerate(counter_indices):
            if counter_index in counter_indices[0:i]:
                continue

            if packet[i] not in data_dict[counter_index_to_input[counter_index]].keys():
                data_dict[counter_index_to_input[counter_index]][packet[i]] = 1
            else:
                data_dict[counter_index_to_input[counter_index]][packet[i]] += 1

            if packet[i] < so.ZERO_THRESHOLD:
                samples.append(0)
            else:
                samples.append(1)

    return {"samples": samples, "rabi": data_dict}
