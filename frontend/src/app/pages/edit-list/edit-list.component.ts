import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TaskService } from '../../services/task/task.service';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-edit-list',
  templateUrl: './edit-list.component.html',
  styleUrls: ['./edit-list.component.scss']
})
export class EditListComponent implements OnInit {
  listId: string;
  listTitle: any;
  listTitleFormControl = new FormControl('listTitleFormControl');


  constructor(private route: ActivatedRoute, private router: Router, private taskService: TaskService) { }

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      this.listId = params.listId;
    });

  this.listTitle = this.route.snapshot.paramMap.get("listTitle");
  this.listTitleFormControl.setValue(this.listTitle);

  }

  updateList(title: string) {
    this.taskService.updateList(this.listId, title).subscribe(() => {
      this.router.navigate(['/lists', this.listId]);
    });
  }

}
