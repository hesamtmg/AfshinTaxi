<template>
  <div class="plate-input">
    <input
      style="width: 150px"
      v-model="part1"
      maxlength="2"
      placeholder="12"
      @input="emitValue"
    />

    <select v-model="letter" @change="emitValue">
      <option v-for="l in letters" :key="l" :value="l">
        {{ l }}
      </option>
    </select>

    <input
      style="width: 150px"
      v-model="part2"
      maxlength="3"
      placeholder="345"
      @input="emitValue"
    />

    <input
      style="width: 150px"
      v-model="cityCode"
      maxlength="2"
      placeholder="67"
      @input="emitValue"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";

const emit = defineEmits(["update:modelValue"]);

const part1 = ref("");
const letter = ref("ب");
const part2 = ref("");
const cityCode = ref("");

const letters = [
  "ب",
  "ج",
  "د",
  "س",
  "ص",
  "ط",
  "ق",
  "ل",
  "م",
  "ن",
  "و",
  "ه",
  "ی",
];

function emitValue() {
  emit(
    "update:modelValue",
    `${part1.value}${letter.value}${part2.value}-${cityCode.value}`
  );
}
</script>

<style scoped>
.plate-input {
  display: flex;
  gap: 8px;
}

input,
select {
  height: 42px;
  text-align: center;
  font-size: 18px;
}
</style>