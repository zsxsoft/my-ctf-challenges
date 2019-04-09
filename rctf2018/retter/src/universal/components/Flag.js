import React, { PureComponent } from 'react'

export default class Flag extends PureComponent {
  state = {
    flag: 'RCTF{reAct_dev_t0ol_1s_4_w4y_to_rEad_st4te}'
  }

  render () {
    return (
      <flag style={{display: 'none'}}>
        {'fake_flag{flag_is_in_my_component_but_not_in_html}'}
      </flag>
    )
  }
}
