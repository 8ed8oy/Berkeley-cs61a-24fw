from scheme import create_global_frame
from scheme_reader import read_line
from scheme_eval_apply import scheme_eval

env = create_global_frame()
scheme_eval(read_line("(load \"questions\")"), env)
print(scheme_eval(read_line("(enumerate (quote (3 4 5 6)))"), env))
