namespace Slider {
  type Item = {
    _id: string;
    image: string;
    url: string;
  };

  namespace Api {
    type GetAllVars = {
      page: number;
      limit: number;
    };

    type GetAllResponse = {
      sliders: Slider.Item[];
      totalSliders: number;
    };
  }
}
