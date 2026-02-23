import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseInputText from './BaseInputText.vue'

describe('BaseInputText', () => {
  it('renders properly', () => {
    const wrapper = mount(BaseInputText, {
      props: { modelValue: '' }
    })
    expect(wrapper.find('input').exists()).toBe(true)
  })
})
