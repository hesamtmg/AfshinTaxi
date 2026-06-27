<template>
  <div class="iran-plate">
    <div class="flag">
      <span style="font-size: 28px !important;height: 32px;">🇮🇷</span>

      <span>IRAN</span>
    </div>

    <div class="plate-content">
      <span>{{ first }}</span>
      <span class="letter">{{ letter }}</span>
      <span>{{ second }}</span>
      <span class="city"><div style="font-size: 10px;height: 8px;margin-top:5px" >ایران</div>{{ city }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  plate: {
    type: String,
    default: ""
  }
});

const parsed = computed(() => {
  const match = props.plate.match(/^(\d{0,2})([^\d]?)(\d{0,3})-(\d{0,2})$/);

  if (!match) {
    return {
      first: "",
      letter: "",
      second: "",
      city: ""
    };
  }

  return {
    first: match[1],
    letter: match[2],
    second: match[3],
    city: match[4]
  };
});

const first = computed(() => parsed.value.first);
const letter = computed(() => parsed.value.letter);
const second = computed(() => parsed.value.second);
const city = computed(() => parsed.value.city);
</script>

<style scoped>
.iran-plate {
  display: flex;
  width: 240px;
  height: 60px;
  border: 3px solid #222;
  border-radius: 10px;
  overflow: hidden;
  background: white;
  font-family: Tahoma, sans-serif;
  direction: ltr;
}

.flag {
width: 40px;
    padding-left: 5px;
    font-size: 12px;
    background: #0047ab;
    color: white;
    display: flex;
    flex-direction: column;
    align-items: baseline;
    font-weight: bold;
}

.plate-content {
  flex: 1;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  font-size: 34px;
  font-weight: bold;
}

.letter {
  font-size: 40px;
}

.city {
  border-left: 2px solid #333;
  padding-left: 5px;
}
</style>